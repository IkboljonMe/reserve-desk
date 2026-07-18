import { NextRequest } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { MenuOrder } from '@/models/MenuOrder'

// PUBLIC (no auth) — a guest polls their own order's status after placing it.
// The tenant is resolved from ?hotel=<hotelSlug> (globally-unique); the order
// must belong to that hotel's company or this 404s (no cross-tenant leakage).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const hotelSlug = req.nextUrl.searchParams.get('hotel') || ''
  if (!hotelSlug) return Response.json({ error: 'Unknown hotel' }, { status: 400 })

  const { id } = await params

  await connectDB()
  const hotel = await Hotel.findOne({ slug: hotelSlug })
    .select('_id companyId')
    .lean<{ _id: Types.ObjectId; companyId: Types.ObjectId } | null>()
  if (!hotel) return Response.json({ error: 'Unknown hotel' }, { status: 404 })

  const order = await MenuOrder.findOne({ _id: id, companyId: hotel.companyId })
    .select('status items subtotal serviceFee total roomNumber note createdAt')
    .lean()
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(order)
}
