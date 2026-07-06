import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Client } from '@/models/Client'
import { getSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    await connectDB()
    const client = await Client.findByIdAndUpdate(id, body, { new: true }).lean()
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(client)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()
    await Client.findByIdAndDelete(id)
    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
