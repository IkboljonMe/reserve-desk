import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { Company } from '@/models/Company'
import { createSession } from '@/lib/session'
import { DEMO_OWNER_EMAIL } from '@/features/demo/config'

export async function GET(req: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Always build redirects from the PUBLIC host header — never req.url, which
  // behind nginx is the internal http://localhost:3005 and would leak.
  const host = req.headers.get('host') || 'demo.bronit.test:3000'
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') ? 'http' : 'https')
  const origin = `${protocol}://${host}`

  try {
    await connectDB()
    const admin = await Admin.findOne({ email: DEMO_OWNER_EMAIL.toLowerCase().trim() })
    if (!admin) {
      console.error(`Demo owner ${DEMO_OWNER_EMAIL} not found — run: npx tsx src/scripts/seed-demo.ts`)
      return NextResponse.redirect(new URL(`/${locale}/login`, origin))
    }

    // We don't verify password here because it's a dedicated demo sandbox auto-login endpoint
    const company = await Company.findById(admin.companyId).select('slug').lean<{ slug: string }>()
    const companyId = admin.companyId ? admin.companyId.toString() : null

    await createSession(
      admin._id.toString(), admin.email, admin.name, admin.role,
      companyId, company?.slug || null, null, null
    )

    // Redirect cleanly to the dashboard. The proxy keeps them on demo.bronit.uz.
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, origin))
  } catch (err) {
    console.error('Demo auto-login error:', err)
    return NextResponse.redirect(new URL(`/${locale}/login`, origin))
  }
}
