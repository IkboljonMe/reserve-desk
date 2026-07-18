import { NextRequest } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { MenuRecommendation } from '@/models/MenuRecommendation'
import { MenuProduct } from '@/models/MenuProduct'
import { requireDashboard, requireWritable, writeHotelId } from '@/lib/session'

interface PopulatedProduct {
  _id: Types.ObjectId
  name: string
  nameI18n: unknown
  descI18n: unknown
  price: number
  imageUrl: string
  available: boolean
}

interface RecommendationLean {
  _id: Types.ObjectId
  hotelId: Types.ObjectId
  dayOfWeek: number
  sortOrder: number
  productId: PopulatedProduct
}

// GET /api/menu/recommendations?hotelId=… — featured products by weekday.
export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const hotelId = writeHotelId(session, searchParams.get('hotelId'))
  if (!hotelId) return Response.json({ error: 'Hotel is required' }, { status: 400 })

  await connectDB()
  const recs = await MenuRecommendation.find({ companyId: session.companyId, hotelId })
    .sort({ dayOfWeek: 1, sortOrder: 1 })
    .populate('productId', 'name nameI18n descI18n price imageUrl available')
    .lean<RecommendationLean[]>()

  // Flatten the populated field to `product` so the client doesn't need to know
  // Mongoose's populate shape, and skip any whose product got deleted.
  const out = recs
    .filter(r => r.productId)
    .map(r => ({ ...r, product: r.productId, productId: r.productId._id }))
  return Response.json(out)
}

// POST /api/menu/recommendations — feature a product on a weekday.
export async function POST(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const body = await req.json()
    const dayOfWeek = Number(body.dayOfWeek)
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return Response.json({ error: 'Invalid day' }, { status: 400 })
    }
    const hotelId = writeHotelId(session, body.hotelId)
    if (!hotelId) return Response.json({ error: 'Hotel is required' }, { status: 400 })
    if (!body.productId) return Response.json({ error: 'Product is required' }, { status: 400 })

    await connectDB()
    const product = await MenuProduct.findOne({ _id: body.productId, companyId: session.companyId, hotelId }).select('_id').lean()
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 })

    const count = await MenuRecommendation.countDocuments({ hotelId, dayOfWeek })
    const rec = await MenuRecommendation.create({
      companyId: session.companyId,
      hotelId,
      dayOfWeek,
      productId: body.productId,
      sortOrder: count,
    })
    return Response.json(rec, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return Response.json({ error: 'Already featured on that day' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to create recommendation' }, { status: 500 })
  }
}
