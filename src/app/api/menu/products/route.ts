import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuProduct } from '@/models/MenuProduct'
import { requireDashboard, requireWritable, writeHotelId } from '@/lib/session'
import { sanitizeI18n, sanitizeLocked } from '@/lib/menu'

function toUZS(v: unknown): number {
  return Math.max(0, Math.round(Number(v) || 0))
}

// GET /api/menu/products?hotelId=… — every product for a hotel's menu.
export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const hotelId = writeHotelId(session, searchParams.get('hotelId'))
  if (!hotelId) return Response.json({ error: 'Hotel is required' }, { status: 400 })

  await connectDB()
  const products = await MenuProduct.find({ companyId: session.companyId, hotelId })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()
  return Response.json(products)
}

// POST /api/menu/products — create a product in a category.
export async function POST(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const body = await req.json()
    if (!body.name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })
    if (!body.categoryId) return Response.json({ error: 'Category is required' }, { status: 400 })

    const hotelId = writeHotelId(session, body.hotelId)
    if (!hotelId) return Response.json({ error: 'Hotel is required' }, { status: 400 })

    await connectDB()
    const product = await MenuProduct.create({
      companyId: session.companyId,
      hotelId,
      categoryId: body.categoryId,
      name: body.name.trim(),
      description: typeof body.description === 'string' ? body.description : '',
      sourceLang: body.sourceLang || 'en',
      nameI18n: sanitizeI18n(body.nameI18n),
      nameI18nLocked: sanitizeLocked(body.nameI18nLocked),
      descI18n: sanitizeI18n(body.descI18n),
      descI18nLocked: sanitizeLocked(body.descI18nLocked),
      price: toUZS(body.price),
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
      available: body.available !== false,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
    })
    return Response.json(product, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
