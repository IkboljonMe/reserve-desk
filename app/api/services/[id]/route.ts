import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Service } from '@/models/Service'
import '@/models/Hotel'
import { getSession, requireOwner } from '@/lib/session'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/services/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  await connectDB()
  const service = await Service.findById(id).populate('hotelId').lean()
  if (!service) return Response.json({ error: 'Not found' }, { status: 404 })
  // Admins can only read services belonging to their own hotel.
  if (session.role !== 'owner' && String((service.hotelId as { _id?: unknown })?._id ?? service.hotelId) !== session.hotelId) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  return Response.json(service)
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/services/[id]'>) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  const { id } = await ctx.params
  const body = await req.json()

  await connectDB()
  
  const parsedBody = {
    ...body,
    ...(body.slotDuration !== undefined && { slotDuration: Number(body.slotDuration) }),
    ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
    ...(body.price !== undefined && { price: Number(body.price) }),
    ...(body.isFree !== undefined && { isFree: Boolean(body.isFree) }),
    ...(body.bufferTimeBefore !== undefined && { bufferTimeBefore: Number(body.bufferTimeBefore) }),
    ...(body.bufferTimeAfter !== undefined && { bufferTimeAfter: Number(body.bufferTimeAfter) }),
    ...(body.hotelId === '' && { hotelId: null }),
    ...(Array.isArray(body.pricingPlans) && { pricingPlans: body.pricingPlans }),
    ...(Array.isArray(body.pricingGroups) && { pricingGroups: body.pricingGroups }),
  }

  const service = await Service.findByIdAndUpdate(
    id,
    parsedBody,
    { new: true, runValidators: true }
  ).lean()

  if (!service) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(service)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/services/[id]'>) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  const { id } = await ctx.params
  await connectDB()
  await Service.findByIdAndDelete(id)
  return Response.json({ success: true })
}
