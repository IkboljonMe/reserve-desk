import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'

// POST /api/menu/guest/report — anonymous guest problem report.
// Body: { hotel: string, room: string, message: string }
// For MVP: logs to the console and returns 200. A future version will forward
// to the hotel's Telegram bot.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { hotel: hotelSlug, room, message } = body ?? {}

    if (!hotelSlug || !message?.trim()) {
      return Response.json({ error: 'hotel and message are required' }, { status: 400 })
    }

    await connectDB()
    const hotel = await Hotel.findOne({ slug: hotelSlug }).select('name').lean<{ name: string } | null>()

    // Log the report. TODO: forward to Telegram when the hotel has a bot token.
    console.info(`[guest-report] Hotel: ${hotel?.name ?? hotelSlug} | Room: ${room || '?'} | ${message.trim()}`)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[guest-report]', err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
