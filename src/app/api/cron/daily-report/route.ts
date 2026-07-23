import { NextRequest } from 'next/server'
import { requireCron } from '@/lib/cron'
import { sendDailyReportsForAll } from '@/lib/telegramReports'

// GET /api/cron/daily-report — end-of-day income summary posted to every
// company's Telegram group. Meant to run once a day just after midnight UZ (it
// reports the day that just ended). Guarded by CRON_SECRET (see requireCron).
export async function GET(req: NextRequest) {
  const blocked = requireCron(req)
  if (blocked) return blocked

  try {
    const sent = await sendDailyReportsForAll()
    return Response.json({ ok: true, sent })
  } catch (err) {
    console.error('Cron daily report failed', err)
    return Response.json({ error: 'Failed to send daily reports' }, { status: 500 })
  }
}
