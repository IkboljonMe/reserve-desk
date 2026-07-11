import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Company, RESERVED_SLUGS, SLUG_PATTERN } from '@/models/Company'
import { Admin } from '@/models/Admin'
import { requireSuperadmin } from '@/lib/session'

export async function GET() {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  await connectDB()
  const companies = await Company.find().sort({ createdAt: -1 }).lean()
  return Response.json(companies)
}

// Creates a Company AND its first Owner admin account in one step — a company
// is useless to its customer without someone able to log in and run it.
export async function POST(req: NextRequest) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
    const plan = ['standard', 'pro', 'vip'].includes(body.plan) ? body.plan : 'standard'
    const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : ''
    const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim() : ''
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : ''
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    const ownerName = typeof body.ownerName === 'string' ? body.ownerName.trim() : ''
    const ownerEmail = typeof body.ownerEmail === 'string' ? body.ownerEmail.toLowerCase().trim() : ''
    const ownerPassword = typeof body.ownerPassword === 'string' ? body.ownerPassword : ''

    if (!name) return Response.json({ error: 'Company name is required' }, { status: 400 })
    if (!slug || !SLUG_PATTERN.test(slug) || RESERVED_SLUGS.includes(slug)) {
      return Response.json({ error: 'Slug must be lowercase letters, numbers and hyphens, and not a reserved word' }, { status: 400 })
    }
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
      return Response.json({ error: 'A valid expiry date is required' }, { status: 400 })
    }
    if (!ownerName || !ownerEmail || !ownerPassword) {
      return Response.json({ error: 'Owner name, email, and password are required' }, { status: 400 })
    }
    if (ownerPassword.length < 6) {
      return Response.json({ error: 'Owner password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    const slugClash = await Company.findOne({ slug })
    if (slugClash) return Response.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })

    const emailClash = await Admin.findOne({ email: ownerEmail })
    if (emailClash) return Response.json({ error: 'An account with that email already exists' }, { status: 409 })

    const company = await Company.create({ name, slug, plan, expiresAt, contactName, contactPhone, paymentMethod })
    const owner = await Admin.create({
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      role: 'owner',
      companyId: company._id,
      hotelId: null,
    })

    return Response.json({ company, owner: { _id: owner._id, name: owner.name, email: owner.email } }, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return Response.json({ error: 'Slug or email already in use' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
