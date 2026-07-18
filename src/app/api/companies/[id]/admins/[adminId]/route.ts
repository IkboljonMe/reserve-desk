import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { requireSuperadmin } from '@/lib/session'

// Superadmin resets the password of an owner/admin login it doesn't otherwise
// have access to (passwords are hashed, so there's nothing to read back).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; adminId: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const { id, adminId } = await params
    const body = await req.json()
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!newPassword || newPassword.length < 6) {
      return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()
    const admin = await Admin.findOne({ _id: adminId, companyId: id, role: { $in: ['owner', 'admin'] } })
    if (!admin) return Response.json({ error: 'Not found' }, { status: 404 })

    admin.password = newPassword
    await admin.save()

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
