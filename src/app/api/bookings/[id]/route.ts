import { NextRequest, after } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { Service } from '@/models/Service'
import { requireDashboard, bookingIdScope } from '@/lib/session'
import { hoursForDate } from '@/lib/serviceHours'
import { notifyBookingUpdated } from '@/lib/telegram'

const pad = (n: number) => n.toString().padStart(2, '0')
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const fromMin = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { id } = await ctx.params
  await connectDB()
  const booking = await Booking.findOne(bookingIdScope(session, id))
    .populate('serviceId', 'name color')
    .populate('createdBy', 'email name')
    .populate('history.by', 'email name')
    .lean()
  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(booking)
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { id } = await ctx.params
  const body = await req.json()

  await connectDB()
  const current = await Booking.findOne(bookingIdScope(session, id))
  if (!current) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
  const now = new Date()
  const events: { action: string; at: Date; by: unknown; detail?: string }[] = []
  // Any change to a field shown in the Telegram message triggers an edit.
  let notifyChanged = false

  // Payment updates arrive either as an explicit collected amount (`amountPaid`,
  // supporting deposits) or a legacy full-paid boolean. Both funnel through a
  // single target amount, and `paid` is derived from it.
  const total = current.totalPrice || 0
  const prevAmount = typeof current.amountPaid === 'number' ? current.amountPaid : (current.paid ? total : 0)
  let nextAmount: number | null = null
  if (typeof body.amountPaid === 'number') nextAmount = Math.max(0, Math.min(total, body.amountPaid))
  else if (typeof body.paid === 'boolean') nextAmount = body.paid ? total : 0

  // Only stamp timestamps / log events on real transitions.
  if (nextAmount !== null && nextAmount !== prevAmount) {
    notifyChanged = true
    current.amountPaid = nextAmount
    const nowPaid = total > 0 && nextAmount >= total
    current.paid = nowPaid
    if (nowPaid) {
      current.paidAt = now
      events.push({ action: 'paid', at: now, by: session.userId })
    } else if (nextAmount > 0) {
      current.paidAt = null
      events.push({ action: 'payment', at: now, by: session.userId, detail: String(nextAmount) })
    } else {
      current.paidAt = null
      events.push({ action: 'reopened', at: now, by: session.userId })
    }
  }
  if (typeof body.finished === 'boolean' && body.finished !== current.finished) {
    notifyChanged = true
    current.finished = body.finished
    if (body.finished) { current.finishedAt = now; events.push({ action: 'finished', at: now, by: session.userId }) }
    else { current.finishedAt = null; events.push({ action: 'reopened', at: now, by: session.userId }) }
  }
  if (typeof body.notes === 'string' && body.notes !== current.notes) {
    current.notes = body.notes
    events.push({ action: 'notes_updated', at: now, by: session.userId })
  }
  // Menu/order request is shown in the Telegram message, so a change edits it in place.
  if (typeof body.menu === 'string' && body.menu !== current.menu) {
    current.menu = body.menu; notifyChanged = true
  }
  if (typeof body.menuReadyTime === 'string' && body.menuReadyTime !== current.menuReadyTime) {
    current.menuReadyTime = body.menuReadyTime; notifyChanged = true
  }
  if (typeof body.status === 'string' && body.status !== current.status) {
    notifyChanged = true
    current.status = body.status
  }

  // Guest-detail edits. Name/room/persons appear in the Telegram message.
  if (typeof body.customerName === 'string' && body.customerName.trim() && body.customerName.trim() !== current.customerName) {
    current.customerName = body.customerName.trim(); notifyChanged = true
  }
  if (typeof body.customerPhone === 'string' && body.customerPhone !== current.customerPhone) {
    current.customerPhone = body.customerPhone
  }
  if (typeof body.roomNumber === 'string' && body.roomNumber.trim() !== current.roomNumber) {
    current.roomNumber = body.roomNumber.trim(); notifyChanged = true
  }
  if (typeof body.persons === 'number' && body.persons >= 1 && Math.floor(body.persons) !== current.persons) {
    current.persons = Math.max(1, Math.floor(body.persons)); notifyChanged = true
  }

  // Reschedule: date / time / duration. Re-validate capacity, excluding self.
  const rescheduleKeys = ['date', 'startTime', 'endTime', 'duration'] as const
  if (rescheduleKeys.some(k => body[k] !== undefined)) {
    const newDate = typeof body.date === 'string' && body.date ? body.date : current.date
    const newStart = typeof body.startTime === 'string' && body.startTime ? body.startTime : current.startTime
    const newEnd = typeof body.endTime === 'string' && body.endTime ? body.endTime : current.endTime
    const newDuration = typeof body.duration === 'number' && body.duration > 0 ? Math.round(body.duration) : current.duration
    const moved = newDate !== current.date || newStart !== current.startTime || newEnd !== current.endTime || newDuration !== current.duration
    if (moved) {
      const service = await Service.findById(current.serviceId).lean()
      if (service && hoursForDate(service, newDate).closed) {
        return Response.json({ error: 'The service is closed on this date' }, { status: 409 })
      }
      const bufBefore = service?.bufferTimeBefore || 0
      const bufAfter = service?.bufferTimeAfter || 0
      const capacity = service?.capacity || 1
      const bufferedEndTime = fromMin(toMin(newEnd) + bufAfter)
      const bufferedStartTime = fromMin(Math.max(0, toMin(newStart) - bufBefore))
      const overlap = await Booking.countDocuments({
        serviceId: current.serviceId,
        date: newDate,
        status: { $ne: 'cancelled' },
        _id: { $ne: current._id },
        startTime: { $lt: bufferedEndTime },
        endTime: { $gt: bufferedStartTime },
      })
      if (overlap >= capacity) {
        return Response.json({ error: 'This time slot is fully booked for this service' }, { status: 409 })
      }
      current.date = newDate
      current.startTime = newStart
      current.endTime = newEnd
      current.duration = newDuration
      current.bufferedEndTime = bufferedEndTime
      notifyChanged = true
      events.push({ action: 'rescheduled', at: now, by: session.userId })
    }
  }

  if (events.length) current.history.push(...(events as never[]))
  await current.save()

  const booking = await Booking.findById(id)
    .populate('serviceId', 'name color')
    .populate('createdBy', 'email name')
    .populate('history.by', 'email name')
    .lean()

  // Payment / finished / cancelled are shown in the Telegram message — edit it
  // in place so the group stays in sync (never post a duplicate). Best-effort,
  // post-response.
  if (notifyChanged && booking?.tgMessageId != null && booking.tgChatId != null) {
    const svc = booking.serviceId as unknown as { name?: string } | null
    const creator = booking.createdBy as unknown as { name?: string } | null
    after(() =>
      notifyBookingUpdated(
        { chatId: booking.tgChatId!, messageId: booking.tgMessageId!, messageThreadId: booking.tgThreadId ?? undefined },
        {
          hotelId: booking.hotelId,
          serviceId: booking.serviceId as unknown as { _id: string; name: string },
          customerName: booking.customerName,
          roomNumber: booking.roomNumber,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          persons: booking.persons,
          totalPrice: booking.totalPrice,
          amountPaid: booking.amountPaid,
          paid: booking.paid,
          finished: booking.finished,
          status: booking.status,
          menu: booking.menu,
          menuReadyTime: booking.menuReadyTime,
          createdByName: creator?.name,
        },
        svc?.name,
      )
    )
  }

  return Response.json(booking)
  } catch (err) {
    // Surface a clean error instead of an unhandled 500 (e.g. a validation
    // error on a legacy record, or a transient DB issue).
    console.error(`Failed to update booking ${id}`, err)
    return Response.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { id } = await ctx.params
  await connectDB()
  const deleted = await Booking.findOneAndDelete(bookingIdScope(session, id))
    .populate('serviceId', 'name')
    .populate('createdBy', 'name')
    .lean()

  // Reflect the removal in Telegram by marking the message cancelled (rather than
  // leaving a stale "new booking"). Best-effort, post-response.
  if (deleted?.tgMessageId != null && deleted.tgChatId != null) {
    const svc = deleted.serviceId as unknown as { name?: string } | null
    const creator = deleted.createdBy as unknown as { name?: string } | null
    after(() =>
      notifyBookingUpdated(
        { chatId: deleted.tgChatId!, messageId: deleted.tgMessageId!, messageThreadId: deleted.tgThreadId ?? undefined },
        {
          hotelId: deleted.hotelId,
          serviceId: deleted.serviceId as unknown as { _id: string; name: string },
          customerName: deleted.customerName,
          roomNumber: deleted.roomNumber,
          date: deleted.date,
          startTime: deleted.startTime,
          endTime: deleted.endTime,
          persons: deleted.persons,
          totalPrice: deleted.totalPrice,
          amountPaid: deleted.amountPaid,
          paid: deleted.paid,
          menu: deleted.menu,
          menuReadyTime: deleted.menuReadyTime,
          status: 'cancelled',
          createdByName: creator?.name,
        },
        svc?.name,
      )
    )
  }

  return Response.json({ success: true })
}
