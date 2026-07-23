import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { GuestService } from '@/models/GuestService'
import { requireDashboard, requireWritable, writeHotelId } from '@/lib/session'
import { sanitizeI18n, sanitizeLocked } from '@/lib/menu'

// GET /api/menu/guest-services?hotelId=… — every guest service for one hotel,
// including hidden (inactive) ones so the manager can toggle visibility.
export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const hotelId = writeHotelId(session, searchParams.get('hotelId'))
  if (!hotelId) return Response.json({ error: 'Hotel is required' }, { status: 400 })

  await connectDB()
  const services = await GuestService.find({ companyId: session.companyId, hotelId })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()
  return Response.json(services)
}

// POST /api/menu/guest-services — create a guest service for a hotel.
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
    const service = await GuestService.create({
      companyId: session.companyId,
      hotelId,
      name: body.name.trim(),
      sourceLang: body.sourceLang || 'en',
      nameI18n: sanitizeI18n(body.nameI18n),
      nameI18nLocked: sanitizeLocked(body.nameI18nLocked),
      description: typeof body.description === 'string' ? body.description : '',
      descI18n: sanitizeI18n(body.descI18n),
      descI18nLocked: sanitizeLocked(body.descI18nLocked),
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
      price: Math.max(0, Math.round(Number(body.price) || 0)),
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
      active: body.active !== false,
    })
    return Response.json(service, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create guest service' }, { status: 500 })
  }
}
