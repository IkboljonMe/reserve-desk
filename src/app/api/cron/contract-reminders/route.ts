import { NextRequest } from 'next/server'
import { requireCron } from '@/lib/cron'
import { sendContractRemindersForAll } from '@/lib/contractReminders'

// GET /api/cron/contract-reminders — daily reminder sweep across every company
// with Telegram configured. Meant to be hit by a scheduler once a day. Guarded
// by CRON_SECRET (see requireCron).
export async function GET(req: NextRequest) {
  const blocked = requireCron(req)
  if (blocked) return blocked

  try {
    const sent = await sendContractRemindersForAll()
    return Response.json({ ok: true, sent })
  } catch (err) {
    console.error('Cron contract reminders failed', err)
    return Response.json({ error: 'Failed to run reminders' }, { status: 500 })
  }
}
