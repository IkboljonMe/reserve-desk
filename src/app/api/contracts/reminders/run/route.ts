import { requireDashboard, requireWritable } from '@/lib/session'
import { sendContractRemindersForCompany } from '@/lib/contractReminders'

// POST /api/contracts/reminders/run — manually run the reminder sweep for the
// signed-in owner's company and post any newly-due reminders to their Telegram
// group. Backs the "Send reminders now" button so reminders can be verified on
// demand (e.g. after adding a contract that finishes soon).
export async function POST() {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const sent = await sendContractRemindersForCompany(session.companyId)
    return Response.json({ ok: true, sent })
  } catch (err) {
    console.error('Failed to run contract reminders', err)
    return Response.json({ error: 'Failed to run reminders' }, { status: 500 })
  }
}
