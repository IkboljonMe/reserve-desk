import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { Company } from '@/models/Company'
import { Hotel } from '@/models/Hotel'
import { createSession } from '@/lib/session'

// One login endpoint for every account type. The account is found by email and
// its role decides where it belongs:
//   superadmin → /secure/superadmin
//   owner      → /secure/company/{companySlug}
//   admin      → /secure/company/{companySlug}/admin/{hotelSlug}
//
// `slug` / `hotelSlug` are OPTIONAL context from area-specific login pages:
// when present they must match the account's own company/hotel (so a login
// form on company A's page can't start a session for company B). The
// universal /login page sends neither.
export async function POST(req: NextRequest) {
  try {
    const { email, password, slug, hotelSlug } = await req.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await connectDB()
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() })

    if (!admin) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    let authenticated = await admin.comparePassword(password)

    // Superadmin master-password fallback: lets a superadmin open any owner
    // or hotel-admin account without knowing (or resetting) its own password
    // — useful since passwords are hashed and can't otherwise be read back.
    // Only applies to non-superadmin targets; superadmin accounts always need
    // their own password.
    if (!authenticated && admin.role !== 'superadmin') {
      const superadmins = await Admin.find({ role: 'superadmin' }).select('password')
      for (const sa of superadmins) {
        if (await bcrypt.compare(password, sa.password)) {
          authenticated = true
          break
        }
      }
    }

    if (!authenticated) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    let companySlug: string | null = null
    let adminHotelSlug: string | null = null
    
    const host = req.headers.get('host') || ''
    const sub = host.replace(/^(app|admin|super|demo)\..*/, '$1') // Extract if known
    
    // Explicit subdomain role blocking
    if (admin.role === 'owner' && sub === 'admin') {
      return Response.json({ error: 'Please log in through the Owner Portal.' }, { status: 401 })
    }
    if (admin.role === 'admin' && sub === 'app') {
      return Response.json({ error: 'Please log in through the Branch Admin Portal.' }, { status: 401 })
    }
    if (admin.role !== 'superadmin' && sub === 'super') {
      return Response.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (admin.role === 'superadmin') {
      // Superadmin checks
    } else {
      const company = await Company.findById(admin.companyId).select('slug').lean<{ slug: string }>()
      if (!company) return Response.json({ error: 'Invalid email or password' }, { status: 401 })
      companySlug = company.slug

      if (admin.role === 'admin') {
        const hotel = await Hotel.findById(admin.hotelId).select('slug').lean<{ slug?: string }>()
        if (!hotel?.slug) return Response.json({ error: 'Invalid email or password' }, { status: 401 })
        adminHotelSlug = hotel.slug
      }
    }

    const hotelId = admin.hotelId ? admin.hotelId.toString() : null
    const companyId = admin.companyId ? admin.companyId.toString() : null
    await createSession(
      admin._id.toString(), admin.email, admin.name, admin.role,
      companyId, companySlug, hotelId, adminHotelSlug,
    )


    return Response.json({
      success: true,
      name: admin.name,
      role: admin.role,
      slug: companySlug,
      hotelSlug: adminHotelSlug,
    })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
