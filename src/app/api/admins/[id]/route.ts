import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { Hotel } from '@/models/Hotel'
import { requireOwner, requireWritable } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const { id } = await params
    const body = await req.json()

    await connectDB()

    const update: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
    if (typeof body.email === 'string' && body.email.trim()) update.email = body.email.toLowerCase().trim()
    if (body.hotelId) {
      const hotel = await Hotel.findOne({ _id: body.hotelId, companyId: session.companyId })
      if (!hotel) return Response.json({ error: 'Hotel not found' }, { status: 404 })
      update.hotelId = body.hotelId
    }

    const admin = await Admin.findOne({ _id: id, role: 'admin', companyId: session.companyId })
    if (!admin) return Response.json({ error: 'Not found' }, { status: 404 })

    Object.assign(admin, update)
    // Assigning `password` triggers the model's hashing pre-save hook.
    if (typeof body.password === 'string' && body.password) {
      if (body.password.length < 6) {
        return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      admin.password = body.password
    }
    await admin.save()

    const { password: _pw, ...safe } = admin.toObject()
    return Response.json(safe)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return Response.json({ error: 'An account with that email already exists' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  const { id } = await params
  await connectDB()
  // Never allow deleting the owner via this endpoint.
  await Admin.findOneAndDelete({ _id: id, role: 'admin', companyId: session.companyId })
  return Response.json({ ok: true })
}
