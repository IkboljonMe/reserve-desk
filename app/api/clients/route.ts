import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Client } from '@/models/Client'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { roomNumber: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ]
  }

  const clients = await Client.find(filter)
    .sort({ name: 1 })
    .lean()

  return Response.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, phone, roomNumber, floor, notes } = body

    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 })

    await connectDB()
    const client = await Client.create({ name, phone, roomNumber, floor, notes })
    return Response.json(client, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
