import { requireOwner, requireWritable } from '@/lib/session'
import { disconnectTelegram } from '@/lib/telegram'

export async function POST() {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  await disconnectTelegram(session.companyId)
  return Response.json({ ok: true })
}
