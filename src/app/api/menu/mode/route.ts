import { NextRequest } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Company } from '@/models/Company'
import { Hotel } from '@/models/Hotel'
import { requireDashboard, requireOwner, requireWritable } from '@/lib/session'

// GET /api/menu/mode — the company's menu scope (shared vs per-hotel) and, when
// shared, which hotel's menu is the shared source.
export async function GET() {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  await connectDB()
  const company = await Company.findById(session.companyId)
    .select('menuMode menuSourceHotelId')
    .lean<{ menuMode?: string; menuSourceHotelId?: Types.ObjectId | null } | null>()

  return Response.json({
    mode: company?.menuMode || 'per_hotel',
    sourceHotelId: company?.menuSourceHotelId ? String(company.menuSourceHotelId) : null,
  })
}

// PUT /api/menu/mode — owner-only: switch scope and/or pick the shared source
// hotel. Switching to shared without a source defaults to the first hotel.
export async function PUT(req: NextRequest) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const body = await req.json()
    const mode = body.mode === 'shared' ? 'shared' : 'per_hotel'

    await connectDB()
    const update: Record<string, unknown> = { menuMode: mode }

    if (mode === 'shared') {
      let sourceId = typeof body.sourceHotelId === 'string' ? body.sourceHotelId : ''
      // Validate the chosen source belongs to this company; otherwise fall back
      // to the company's first hotel so shared mode always has a real source.
      const valid = sourceId
        ? await Hotel.exists({ _id: sourceId, companyId: session.companyId })
        : null
      if (!valid) {
        const first = await Hotel.findOne({ companyId: session.companyId })
          .sort({ createdAt: 1 })
          .select('_id')
          .lean<{ _id: Types.ObjectId } | null>()
        if (!first) return Response.json({ error: 'No hotels to share a menu across' }, { status: 400 })
        sourceId = String(first._id)
      }
      update.menuSourceHotelId = sourceId
    }

    const company = await Company.findByIdAndUpdate(session.companyId, update, { new: true })
      .select('menuMode menuSourceHotelId')
      .lean<{ menuMode?: string; menuSourceHotelId?: Types.ObjectId | null } | null>()

    return Response.json({
      mode: company?.menuMode || 'per_hotel',
      sourceHotelId: company?.menuSourceHotelId ? String(company.menuSourceHotelId) : null,
    })
  } catch (err) {
    console.error('Failed to update menu mode', err)
    return Response.json({ error: 'Failed to update menu mode' }, { status: 500 })
  }
}
