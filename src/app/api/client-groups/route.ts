import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ClientGroup } from '@/models/ClientGroup'
import { getSession, requireOwner } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Client groups are global — one shared set for every hotel.
  await connectDB()
  const groups = await ClientGroup.find().sort({ order: 1, name: 1 }).lean()
  return Response.json(groups)
}

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const { name, color, order } = body

    if (!name || !name.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    await connectDB()
    const group = await ClientGroup.create({
      name: name.trim(),
      color: color || '#6366f1',
      order: Number(order) || 0,
    })
    return Response.json(group, { status: 201 })
  } catch (err: unknown) {
    // Duplicate key (unique name)
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return Response.json({ error: 'A group with that name already exists' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
