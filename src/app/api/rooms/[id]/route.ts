import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Room } from '@/models/Room'
import { requireOwner, requireWritable } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const { id } = await params
    const body = await req.json()

    const update: Record<string, unknown> = {}
    if (typeof body.hotelId === 'string' && body.hotelId) update.hotelId = body.hotelId
    if (typeof body.number === 'string') update.number = body.number.trim()
    if (body.floor !== undefined) update.floor = Number(body.floor)
    if (typeof body.type === 'string') update.type = body.type.trim()
    if (typeof body.description === 'string') update.description = body.description

    await connectDB()
    const room = await Room.findOneAndUpdate({ _id: id, companyId: session.companyId }, update, { new: true, runValidators: true }).lean()
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
    return Response.json(room)
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return Response.json({ error: 'That room number already exists for this hotel' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const { id } = await params
    await connectDB()
    await Room.findOneAndDelete({ _id: id, companyId: session.companyId })
    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
