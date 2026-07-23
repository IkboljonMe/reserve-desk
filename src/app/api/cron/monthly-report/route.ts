import { NextRequest } from 'next/server'
import { requireCron } from '@/lib/cron'
import { sendMonthlyReportsForAll } from '@/lib/telegramReports'

// GET /api/cron/monthly-report — end-of-month summary posted to every company's
// reports topic. Meant to run on the 1st of each month (it reports the month
// that just ended). Guarded by CRON_SECRET (see requireCron).
export async function GET(req: NextRequest) {
  const blocked = requireCron(req)
  if (blocked) return blocked

  try {
    const sent = await sendMonthlyReportsForAll()
    return Response.json({ ok: true, sent })
  } catch (err) {
    console.error('Cron monthly report failed', err)
    return Response.json({ error: 'Failed to send monthly reports' }, { status: 500 })
  }
}
