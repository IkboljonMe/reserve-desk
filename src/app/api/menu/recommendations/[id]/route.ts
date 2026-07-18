import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuRecommendation } from '@/models/MenuRecommendation'
import { requireDashboard, requireWritable, idScope } from '@/lib/session'

// DELETE /api/menu/recommendations/:id — unfeature a product.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  const { id } = await params
  await connectDB()
  const deleted = await MenuRecommendation.findOneAndDelete(idScope(session, id)).lean()
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
