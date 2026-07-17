import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuCategory } from '@/models/MenuCategory'
import { requireDashboard, requireWritable, writeHotelId } from '@/lib/session'
import { sanitizeI18n } from '@/lib/menu'

// GET /api/menu/categories?hotelId=… — categories for one hotel's menu.
export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const hotelId = writeHotelId(session, searchParams.get('hotelId'))
  if (!hotelId) return Response.json({ error: 'Hotel is required' }, { status: 400 })

  await connectDB()
  const categories = await MenuCategory.find({ companyId: session.companyId, hotelId })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()
  return Response.json(categories)
}

// POST /api/menu/categories — create a category for a hotel.
export async function POST(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const body = await req.json()
    if (!body.name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })

    const hotelId = writeHotelId(session, body.hotelId)
    if (!hotelId) return Response.json({ error: 'Hotel is required' }, { status: 400 })

    await connectDB()
    const category = await MenuCategory.create({
      companyId: session.companyId,
      hotelId,
      name: body.name.trim(),
      sourceLang: body.sourceLang || 'en',
      nameI18n: sanitizeI18n(body.nameI18n),
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
    })
    return Response.json(category, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
