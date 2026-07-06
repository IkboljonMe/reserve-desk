import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Room } from '@/models/Room'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const rooms = await Room.find({}).sort({ floor: 1, number: 1 }).lean()
  return Response.json(rooms)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { number, floor, description } = body

    if (!number || floor === undefined) {
      return Response.json({ error: 'Room number and floor are required' }, { status: 400 })
    }

    await connectDB()
    const room = await Room.create({ number, floor, description })
    return Response.json(room, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return Response.json({ error: 'Room number already exists' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
