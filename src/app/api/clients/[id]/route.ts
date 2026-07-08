import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Client } from '@/models/Client'
import { requireDashboard, idScope } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const body = await req.json()

    // Whitelist updatable fields; normalize an empty groupId to null so it
    // doesn't fail ObjectId casting.
    const update: Record<string, unknown> = {}
    for (const key of ['name', 'phone', 'roomNumber', 'floor', 'notes'] as const) {
      if (body[key] !== undefined) update[key] = body[key]
    }
    if (body.groupId !== undefined) update.groupId = body.groupId || null

    await connectDB()
    const client = await Client.findOneAndUpdate(idScope(session, id), update, { new: true }).lean()
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(client)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    await connectDB()
    await Client.findOneAndDelete(idScope(session, id))
    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
