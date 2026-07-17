import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuCategory } from '@/models/MenuCategory'
import { MenuProduct } from '@/models/MenuProduct'
import { requireDashboard, requireWritable, idScope } from '@/lib/session'
import { sanitizeI18n } from '@/lib/menu'

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
    if (typeof body.sortOrder === 'number') update.sortOrder = body.sortOrder

    await connectDB()
    const category = await MenuCategory.findOneAndUpdate(idScope(session, id), update, { new: true }).lean()
    if (!category) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(category)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// Deleting a category cascades to its products (no cross-collection FK in Mongo).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  const { id } = await params
  await connectDB()
  const deleted = await MenuCategory.findOneAndDelete(idScope(session, id)).lean()
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 })
  await MenuProduct.deleteMany({ companyId: session.companyId, categoryId: id })
  return Response.json({ ok: true })
}
