import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Room } from '@/models/Room'
import { getSession } from '@/lib/session'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()
    await Room.findByIdAndDelete(id)
    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
