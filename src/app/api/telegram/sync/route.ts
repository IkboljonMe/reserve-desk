import { requireOwner, requireWritable } from '@/lib/session'
import { syncAllTopics } from '@/lib/telegram'

// Manually creates any missing per-service topics right now, instead of
// waiting for each service's first booking.
export async function POST() {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  await syncAllTopics(session.companyId)
  return Response.json({ ok: true })
}
