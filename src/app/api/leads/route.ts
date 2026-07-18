import { NextRequest, after } from 'next/server'
import { sendMessage } from '@/lib/telegram'

// Public call-back request from the marketing site's contact widget — this is
// Bronit's own sales inbox, unrelated to any tenant's connected group, so it
// uses its own fixed chat id rather than TelegramConfig (which is now
// per-company; picking "any" tenant's config here would leak our leads into a
// random customer's Telegram group). No auth (it's a public landing form);
// keep the payload minimal.
const LEADS_CHAT_ID = process.env.TELEGRAM_LEADS_CHAT_ID ? Number(process.env.TELEGRAM_LEADS_CHAT_ID) : null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim().slice(0, 120)
    const phone = String(body?.phone ?? '').trim().slice(0, 40)

    if (!name || !phone) {
      return Response.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    if (LEADS_CHAT_ID) {
      const text = `📞 <b>New call-back request</b>\n👤 ${name}\n📱 ${phone}`
      after(() => sendMessage(LEADS_CHAT_ID, text).catch(() => {}))
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Lead submission failed', err)
    return Response.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
