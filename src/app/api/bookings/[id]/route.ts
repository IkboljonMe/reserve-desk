import { NextRequest, after } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { requireDashboard, bookingIdScope } from '@/lib/session'
import { notifyBookingUpdated } from '@/lib/telegram'

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
  if (typeof body.status === 'string' && body.status !== current.status) {
    notifyChanged = true
    current.status = body.status
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
          status: 'cancelled',
          createdByName: creator?.name,
        },
        svc?.name,
      )
    )
  }

  return Response.json({ success: true })
}
