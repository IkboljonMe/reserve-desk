import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Admin } from '@/models/Admin'
import { Company } from '@/models/Company'
import { createSession } from '@/lib/session'
import { DEMO_OWNER_EMAIL } from '@/features/demo/config'

export async function GET(req: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  try {
    await connectDB()
    const admin = await Admin.findOne({ email: DEMO_OWNER_EMAIL.toLowerCase().trim() })
    if (!admin) return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
    
    // We don't verify password here because it's a dedicated demo sandbox auto-login endpoint
    const company = await Company.findById(admin.companyId).select('slug').lean<{ slug: string }>()
    const companyId = admin.companyId ? admin.companyId.toString() : null
    
    await createSession(
      admin._id.toString(), admin.email, admin.name, admin.role,
      companyId, company?.slug || null, null, null
    )
    
    // Redirect cleanly to the dashboard. The proxy will keep them on demo.bronit.test
    const host = req.headers.get('host') || 'demo.bronit.test:3000'
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') ? 'http' : 'https')
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, `${protocol}://${host}`))
  } catch (err) {
    console.error('Demo auto-login error:', err)
    const host = req.headers.get('host') || 'demo.bronit.test:3000'
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') ? 'http' : 'https')
    return NextResponse.redirect(new URL(`/${locale}/login`, `${protocol}://${host}`))
  }
}
