import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  await connectDB()
  const booking = await Booking.findById(id).populate('serviceId', 'name color').lean()
  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(booking)
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()

  await connectDB()
  const booking = await Booking.findByIdAndUpdate(id, body, { new: true, runValidators: true })
    .populate('serviceId', 'name color')
    .lean()

  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
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
