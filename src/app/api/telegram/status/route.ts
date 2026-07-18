import { requireOwner } from '@/lib/session'
import { getTelegramStatus } from '@/lib/telegram'

// Owner-only: everything Settings > Telegram needs to render — connection
// state, group info, and the list of topics with their mute state.
export async function GET() {
  const session = await requireOwner()
  if (session instanceof Response) return session

  const status = await getTelegramStatus(session.companyId)
  return Response.json(status)
}
