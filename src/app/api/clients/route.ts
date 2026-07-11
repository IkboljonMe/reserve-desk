import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Client } from '@/models/Client'
import '@/models/ClientGroup'
import { requireDashboard, requireWritable } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const groupId = searchParams.get('groupId') || ''

  await connectDB()

  // Clients are a single pool shared across every hotel in the company.
  const filter: Record<string, unknown> = { companyId: session.companyId }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { roomNumber: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ]
  }
  if (groupId === 'none') filter.groupId = null
  else if (groupId) filter.groupId = groupId

  const clients = await Client.find(filter)
    .populate('groupId')
    .sort({ name: 1 })
    .lean()

  return Response.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const body = await req.json()
    const { name, phone, roomNumber, floor, notes, groupId } = body

    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 })

    await connectDB()
    const client = await Client.create({ companyId: session.companyId, name, phone, roomNumber, floor, notes, groupId: groupId || null })
    return Response.json(client, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
