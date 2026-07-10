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
  const events: { action: string; at: Date; by: unknown }[] = []
  let paidChanged = false

  // Only stamp timestamps / log events on real transitions.
  if (typeof body.paid === 'boolean' && body.paid !== current.paid) {
    paidChanged = true
    current.paid = body.paid
    if (body.paid) { current.paidAt = now; events.push({ action: 'paid', at: now, by: session.userId }) }
    else { current.paidAt = null; events.push({ action: 'reopened', at: now, by: session.userId }) }
  }
  if (typeof body.finished === 'boolean' && body.finished !== current.finished) {
    current.finished = body.finished
    if (body.finished) { current.finishedAt = now; events.push({ action: 'finished', at: now, by: session.userId }) }
    else { current.finishedAt = null; events.push({ action: 'reopened', at: now, by: session.userId }) }
  }
  if (typeof body.notes === 'string' && body.notes !== current.notes) {
    current.notes = body.notes
    events.push({ action: 'notes_updated', at: now, by: session.userId })
  }
  if (typeof body.status === 'string') current.status = body.status

  if (events.length) current.history.push(...(events as never[]))
  await current.save()

  const booking = await Booking.findById(id)
    .populate('serviceId', 'name color')
    .populate('createdBy', 'email name')
    .populate('history.by', 'email name')
    .lean()

  // The payment status is shown in the Telegram message — edit it in place so
  // the group stays in sync (never post a duplicate). Best-effort, post-response.
  if (paidChanged && booking?.tgMessageId != null && booking.tgChatId != null) {
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
          totalPrice: booking.totalPrice,
          paid: booking.paid,
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
  await Booking.findOneAndDelete(bookingIdScope(session, id))
  return Response.json({ success: true })
}
