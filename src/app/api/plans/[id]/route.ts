import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Plan } from '@/models/Plan'
import { Company } from '@/models/Company'
import { requireSuperadmin } from '@/lib/session'
import { normalizeFeatures } from '@/lib/planFeatures'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const body = await req.json()

    const update: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
    if (body.price !== undefined) update.price = Math.max(0, Math.round(Number(body.price) || 0))
    if (body.features !== undefined) update.features = normalizeFeatures(body.features)

    await connectDB()
    const plan = await Plan.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    if (!plan) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(plan)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  const { id } = await params
  await connectDB()

  const plan = await Plan.findById(id)
  if (!plan) return Response.json({ error: 'Not found' }, { status: 404 })

  const inUse = await Company.countDocuments({ plan: plan.key })
  if (inUse > 0) {
    return Response.json(
      { error: `${inUse} company(ies) are on this plan. Move them to another plan first.` },
      { status: 409 }
    )
  }

  await Plan.findByIdAndDelete(id)
  return Response.json({ ok: true })
}
