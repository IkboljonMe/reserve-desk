import { NextRequest, after } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { TelegramConfig } from '@/models/TelegramConfig'
import { sendMessage } from '@/lib/telegram'

// Public call-back request from the marketing site's contact widget. Best-effort
// pings the connected Telegram group so an admin can call the lead back. No auth
// (it's a public landing form); keep the payload minimal.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim().slice(0, 120)
    const phone = String(body?.phone ?? '').trim().slice(0, 40)

    if (!name || !phone) {
      return Response.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    await connectDB()
    const config = await TelegramConfig.findOne().sort({ createdAt: -1 }).lean()
    if (config?.groupChatId) {
      const text = `📞 <b>New call-back request</b>\n👤 ${name}\n📱 ${phone}`
      after(() => sendMessage(config.groupChatId, text).catch(() => {}))
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Lead submission failed', err)
    return Response.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
