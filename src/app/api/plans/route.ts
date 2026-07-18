import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Plan, PLAN_KEY_PATTERN } from '@/models/Plan'
import { FEATURE_KEYS } from '@/lib/planFeatures'
import { requireSuperadmin } from '@/lib/session'

export async function GET() {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  await connectDB()
  const plans = await Plan.find().sort({ sortOrder: 1, price: 1, createdAt: 1 }).lean()
  return Response.json(plans)
}

// Coerce the shared pricing/marketing fields from a request body.
function readPlanFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) out.name = body.name.trim()
  if (Array.isArray(body.features)) out.features = body.features.filter((f: unknown) => FEATURE_KEYS.includes(f as never))
  if (body.price !== undefined) out.price = Math.max(0, Math.round(Number(body.price) || 0))
  if (typeof body.description === 'string') out.description = body.description.trim()
  if (body.highlight !== undefined) out.highlight = Boolean(body.highlight)
  if (body.sortOrder !== undefined) out.sortOrder = Math.round(Number(body.sortOrder) || 0)
  return out
}

export async function POST(req: NextRequest) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const key = typeof body.key === 'string' ? body.key.trim().toLowerCase() : ''
    const fields = readPlanFields(body)

    if (!key || !PLAN_KEY_PATTERN.test(key)) {
      return Response.json({ error: 'Key must be lowercase letters, numbers and hyphens' }, { status: 400 })
    }
    if (!fields.name) return Response.json({ error: 'Plan name is required' }, { status: 400 })

    await connectDB()
    const clash = await Plan.findOne({ key })
    if (clash) return Response.json({ error: `Plan key "${key}" is already taken` }, { status: 409 })

    const plan = await Plan.create({ key, ...fields })
    return Response.json(plan, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return Response.json({ error: 'Plan key already exists' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
