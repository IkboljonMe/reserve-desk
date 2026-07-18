import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { HotelMenuSettings } from '@/models/HotelMenuSettings'
import { requireDashboard, writeHotelId } from '@/lib/session'
import type { TileConfig } from '@/models/HotelMenuSettings'

// GET /api/menu/settings?hotelId=... — full hub settings for admin.
export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const hotelId = writeHotelId(session, searchParams.get('hotelId'))
  if (!hotelId) return Response.json({ error: 'hotelId required' }, { status: 400 })

  await connectDB()
  const settings = await HotelMenuSettings.findOne({ companyId: session.companyId, hotelId })
    .lean()

  return Response.json(settings ?? {})
}

// PUT /api/menu/settings — upsert hub settings.
// Body: Partial<IHotelMenuSettings> (hotelId required)
export async function PUT(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const hotelId = writeHotelId(session, body.hotelId)
    if (!hotelId) return Response.json({ error: 'hotelId required' }, { status: 400 })

    await connectDB()

    // Only allow whitelisted fields — never let the client overwrite companyId/hotelId.
    const update: Record<string, unknown> = {}
    const strings = [
      'bannerUrl', 'logoUrl', 'receptionPhone',
      'wifiName', 'wifiPassword',
      'instagramUrl', 'telegramUrl',
      'tripadvisorUrl', 'googleMapsUrl', 'yandexMapsUrl',
    ]
    for (const key of strings) {
      if (key in body) update[key] = typeof body[key] === 'string' ? body[key].trim() : ''
    }

    // Boolean / numeric
    if ('menuEnabled' in body) update.menuEnabled = Boolean(body.menuEnabled)
    if ('serviceFeeType' in body && ['none', 'percent', 'fixed'].includes(body.serviceFeeType)) {
      update.serviceFeeType = body.serviceFeeType
    }
    if ('serviceFeeValue' in body) update.serviceFeeValue = Math.max(0, Number(body.serviceFeeValue) || 0)

    // Tiles array
    if (Array.isArray(body.tiles)) {
      update.tiles = (body.tiles as TileConfig[]).map((t) => ({
        id: t.id,
        enabled: Boolean(t.enabled),
        sortOrder: Number(t.sortOrder) || 0,
        labelUz: String(t.labelUz || '').trim(),
        labelRu: String(t.labelRu || '').trim(),
        labelEn: String(t.labelEn || '').trim(),
      }))
    }

    const settings = await HotelMenuSettings.findOneAndUpdate(
      { companyId: session.companyId, hotelId },
      { $set: { companyId: session.companyId, hotelId, ...update } },
      { upsert: true, new: true },
    ).lean()

    return Response.json(settings)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
