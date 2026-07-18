import { NextRequest, after } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { notifyHubMessage } from '@/lib/telegram'

// POST /api/menu/guest/report — anonymous guest problem report.
// Body: { hotel: string, room: string, message: string }
// Forwards the report to the hotel's HUB Telegram topic (best-effort).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { hotel: hotelSlug, room, message } = body ?? {}

    if (!hotelSlug || !message?.trim()) {
      return Response.json({ error: 'hotel and message are required' }, { status: 400 })
    }

    await connectDB()
    const hotel = await Hotel.findOne({ slug: hotelSlug })
      .select('name companyId')
      .lean<{ _id: Types.ObjectId; name: string; companyId: Types.ObjectId } | null>()

    if (hotel) {
      const text = `⚠️ <b>Guest report</b>\n🏨 ${hotel.name}\n🛏️ ${room || '—'}\n\n${String(message).trim()}`
      after(() => notifyHubMessage(hotel.companyId, hotel._id, text))
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[guest-report]', err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
