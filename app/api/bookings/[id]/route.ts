import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  await connectDB()
  const booking = await Booking.findById(id)
    .populate('serviceId', 'name color')
    .populate('createdBy', 'email name')
    .populate('history.by', 'email name')
    .lean()
  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(booking)
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()

  await connectDB()
  const current = await Booking.findById(id)
  if (!current) return Response.json({ error: 'Not found' }, { status: 404 })

  const now = new Date()
  const events: { action: string; at: Date; by: unknown }[] = []

  // Only stamp timestamps / log events on real transitions.
  if (typeof body.paid === 'boolean' && body.paid !== current.paid) {
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
  return Response.json(booking)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  await connectDB()
  await Booking.findByIdAndDelete(id)
  return Response.json({ success: true })
}
