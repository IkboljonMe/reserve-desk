import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Room } from '@/models/Room'
import { getSession } from '@/lib/session'

// Persist a new manual ordering for a set of rooms. The client sends the room
// ids in their desired sequence; each gets order = its index in the list.
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const ids: unknown = body.ids
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string')) {
      return Response.json({ error: 'ids must be an array of strings' }, { status: 400 })
    }

    await connectDB()
    await Room.bulkWrite(
      (ids as string[]).map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      }))
    )
    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to reorder rooms' }, { status: 500 })
  }
}
