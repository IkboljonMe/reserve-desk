import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { createSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await connectDB()
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() })

    if (!admin || !(await admin.comparePassword(password))) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const hotelId = admin.hotelId ? admin.hotelId.toString() : null
    await createSession(admin._id.toString(), admin.email, admin.name, admin.role, hotelId)

    return Response.json({ success: true, name: admin.name, role: admin.role })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
