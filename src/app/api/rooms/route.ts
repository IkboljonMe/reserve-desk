import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Room } from '@/models/Room'
import { Hotel } from '@/models/Hotel'
import { getSession, requireOwner } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Owner sees every hotel's rooms; an admin only their own hotel's.
  const filter = session.role === 'owner' ? {} : { hotelId: session.hotelId }

  await connectDB()
  const rooms = await Room.find(filter).sort({ floor: 1, order: 1, number: 1 }).lean()
  return Response.json(rooms)
}

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const { hotelId, number, floor, type, description } = body

    if (!hotelId) {
      return Response.json({ error: 'Hotel is required' }, { status: 400 })
    }
    if (!number || floor === undefined) {
      return Response.json({ error: 'Room number and floor are required' }, { status: 400 })
    }

    await connectDB()

    const hotel = await Hotel.findById(hotelId)
    if (!hotel) {
      return Response.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const room = await Room.create({ hotelId, number: String(number).trim(), floor, type: String(type || '').trim(), description })
    return Response.json(room, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return Response.json({ error: 'That room number already exists for this hotel' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
