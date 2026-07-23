import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { GuestService } from '@/models/GuestService'
import { requireDashboard, requireWritable, idScope } from '@/lib/session'
import { sanitizeI18n, sanitizeLocked } from '@/lib/menu'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const { id } = await params
    const body = await req.json()

    const update: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
    if (typeof body.sourceLang === 'string') update.sourceLang = body.sourceLang
    if (body.nameI18n !== undefined) update.nameI18n = sanitizeI18n(body.nameI18n)
    if (body.nameI18nLocked !== undefined) update.nameI18nLocked = sanitizeLocked(body.nameI18nLocked)
    if (typeof body.description === 'string') update.description = body.description
    if (body.descI18n !== undefined) update.descI18n = sanitizeI18n(body.descI18n)
    if (body.descI18nLocked !== undefined) update.descI18nLocked = sanitizeLocked(body.descI18nLocked)
    if (typeof body.imageUrl === 'string') update.imageUrl = body.imageUrl
    if (body.price !== undefined) update.price = Math.max(0, Math.round(Number(body.price) || 0))
    if (typeof body.sortOrder === 'number') update.sortOrder = body.sortOrder
    if (typeof body.active === 'boolean') update.active = body.active

    await connectDB()
    const service = await GuestService.findOneAndUpdate(idScope(session, id), update, { new: true }).lean()
    if (!service) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(service)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update guest service' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  const { id } = await params
  await connectDB()
  const deleted = await GuestService.findOneAndDelete(idScope(session, id)).lean()
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
