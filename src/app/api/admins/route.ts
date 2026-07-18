import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { Hotel } from '@/models/Hotel'
import { requireOwner, requireWritable } from '@/lib/session'
import { isBronitEmail } from '@/lib/bronitEmail'

// Owner-only management of hotel admins. Each admin is bound to exactly one hotel.
export async function GET() {
  const session = await requireOwner()
  if (session instanceof Response) return session

  await connectDB()
  const admins = await Admin.find({ role: 'admin', companyId: session.companyId })
    .select('-password')
    .populate('hotelId', 'name shortName')
    .sort({ createdAt: -1 })
    .lean()
  return Response.json(admins)
}

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const hotelId = body.hotelId

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }
    if (!isBronitEmail(email)) {
      return Response.json({ error: 'Admin email must end with @bronit.uz' }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!hotelId) {
      return Response.json({ error: 'Hotel is required' }, { status: 400 })
    }

    await connectDB()

    const hotel = await Hotel.findOne({ _id: hotelId, companyId: session.companyId })
    if (!hotel) return Response.json({ error: 'Hotel not found' }, { status: 404 })

    const existing = await Admin.findOne({ email })
    if (existing) {
      return Response.json({ error: 'An account with that email already exists' }, { status: 409 })
    }

    // Password is hashed by the Admin model's pre-save hook.
    const admin = await Admin.create({ name, email, password, role: 'admin', companyId: session.companyId, hotelId })
    const { password: _pw, ...safe } = admin.toObject()
    return Response.json(safe, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}
