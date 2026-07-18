import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { requireSuperadmin, createSession } from '@/lib/session'

// Lets the logged-in superadmin change their own login email and/or password.
export async function PUT(req: NextRequest) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!currentPassword) {
      return Response.json({ error: 'Current password is required' }, { status: 400 })
    }
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }
    if (newPassword && newPassword.length < 6) {
      return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    const admin = await Admin.findById(session.userId)
    if (!admin || admin.role !== 'superadmin') {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }
    if (!(await admin.comparePassword(currentPassword))) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    if (email !== admin.email) {
      const clash = await Admin.findOne({ email, _id: { $ne: admin._id } })
      if (clash) return Response.json({ error: 'An account with that email already exists' }, { status: 409 })
      admin.email = email
    }
    if (newPassword) {
      admin.password = newPassword
    }
    await admin.save()

    // Refresh the session cookie so a changed email/password doesn't log the user out.
    await createSession(
      admin._id.toString(), admin.email, admin.name, admin.role,
      null, null, null, null,
    )

    return Response.json({ email: admin.email })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return Response.json({ error: 'An account with that email already exists' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to update account' }, { status: 500 })
  }
}
