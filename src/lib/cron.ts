import type { NextRequest } from 'next/server'

// Guards a cron endpoint with CRON_SECRET. The scheduler must send the secret
// as `Authorization: Bearer <secret>` or `?key=<secret>`. Returns a Response to
// short-circuit with (misconfigured or unauthorized), or null when the caller
// is allowed to proceed. Shared by every /api/cron/* route.
export function requireCron(req: NextRequest): Response | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET is not configured' }, { status: 501 })
  }

  const auth = req.headers.get('authorization') || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const key = new URL(req.url).searchParams.get('key') || ''
  if (bearer !== secret && key !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
