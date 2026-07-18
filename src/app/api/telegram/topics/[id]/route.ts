import { NextRequest } from 'next/server'
import { requireOwner, requireWritable } from '@/lib/session'
import { setTopicNotifications } from '@/lib/telegram'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const kind = body.kind === 'menu' ? 'menu' : body.kind === 'booking' ? 'booking' : null
  const enabled = typeof body.notificationsEnabled === 'boolean' ? body.notificationsEnabled : null

  if (!kind || enabled === null) {
    return Response.json({ error: 'kind and notificationsEnabled are required' }, { status: 400 })
  }

  const found = await setTopicNotifications(session.companyId, kind, id, enabled)
  if (!found) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
