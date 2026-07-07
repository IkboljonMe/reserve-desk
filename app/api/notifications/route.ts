import { connectDB } from '@/lib/mongodb'
import { Contract } from '@/models/Contract'
import { getSession } from '@/lib/session'
import { notificationForContract } from '@/lib/notifications'

// Derived notification feed: computed on the fly from every non-terminated
// contract that has a finish date, so it always reflects the current day
// without needing a background job.
export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const contracts = await Contract.find({
    status: { $ne: 'terminated' },
    finishDate: { $ne: null },
  }).lean()

  const notifications = contracts
    .map(c => notificationForContract(c as never))
    .filter((n): n is NonNullable<typeof n> => n !== null)
    // Most urgent first: expired (negative daysLeft) before soonest.
    .sort((a, b) => a.daysLeft - b.daysLeft)

  return Response.json({ notifications, count: notifications.length })
}
