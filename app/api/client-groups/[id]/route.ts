import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ClientGroup } from '@/models/ClientGroup'
import { Client } from '@/models/Client'
import { requireOwner } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const body = await req.json()
    const update: Record<string, unknown> = {}
    if (typeof body.name === 'string') update.name = body.name.trim()
    if (typeof body.color === 'string') update.color = body.color
    if (body.order !== undefined) update.order = Number(body.order) || 0

    await connectDB()
    const group = await ClientGroup.findByIdAndUpdate(id, update, { new: true }).lean()
    if (!group) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(group)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      return Response.json({ error: 'A group with that name already exists' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    await connectDB()
    // Detach the group from any clients still assigned to it.
    await Client.updateMany({ groupId: id }, { $set: { groupId: null } })
    await ClientGroup.findByIdAndDelete(id)
    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
