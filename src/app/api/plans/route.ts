import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Plan, PLAN_KEY_PATTERN } from '@/models/Plan'
import { FEATURE_KEYS } from '@/lib/planFeatures'
import { requireSuperadmin } from '@/lib/session'

export async function GET() {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  await connectDB()
  const plans = await Plan.find().sort({ createdAt: 1 }).lean()
  return Response.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const key = typeof body.key === 'string' ? body.key.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const features = Array.isArray(body.features) ? body.features.filter((f: unknown) => FEATURE_KEYS.includes(f as never)) : []

    if (!key || !PLAN_KEY_PATTERN.test(key)) {
      return Response.json({ error: 'Key must be lowercase letters, numbers and hyphens' }, { status: 400 })
    }
    if (!name) return Response.json({ error: 'Plan name is required' }, { status: 400 })

    await connectDB()
    const clash = await Plan.findOne({ key })
    if (clash) return Response.json({ error: `Plan key "${key}" is already taken` }, { status: 409 })

    const plan = await Plan.create({ key, name, features })
    return Response.json(plan, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return Response.json({ error: 'Plan key already exists' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}
