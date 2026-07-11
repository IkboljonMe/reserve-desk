import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { Company } from '@/models/Company'
import { createSession } from '@/lib/session'

// Login is tenant-scoped: called from /secure/admin/{slug}/login for owner/admin
// accounts, or from /secure/superadmin for the superadmin. `slug` is required
// for the former and must match the account's own company.
export async function POST(req: NextRequest) {
  try {
    const { email, password, slug } = await req.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await connectDB()
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() })

    if (!admin || !(await admin.comparePassword(password))) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    let companySlug: string | null = null
    if (admin.role === 'superadmin') {
      if (slug) return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    } else {
      const company = await Company.findById(admin.companyId).select('slug').lean<{ slug: string }>()
      if (!company || company.slug !== slug) {
        return Response.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      companySlug = company.slug
    }

    const hotelId = admin.hotelId ? admin.hotelId.toString() : null
    const companyId = admin.companyId ? admin.companyId.toString() : null
    await createSession(admin._id.toString(), admin.email, admin.name, admin.role, companyId, companySlug, hotelId)

    return Response.json({ success: true, name: admin.name, role: admin.role, slug: companySlug })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
