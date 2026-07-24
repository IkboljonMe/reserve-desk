import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Company, RESERVED_SLUGS, slugifyCompanyName } from '@/models/Company'
import { Admin } from '@/models/Admin'
import { Plan } from '@/models/Plan'
import { requireSuperadmin } from '@/lib/session'
import { isBronitEmail } from '@/lib/bronitEmail'
import { DEMO_SLUG } from '@/features/demo/config'
import { normalizeFeatures } from '@/lib/planFeatures'
import { isPaymentStatus, type PaymentStatus } from '@/lib/paymentStatus'

// Derives a URL-safe, globally-unique company slug from its name — appending
// -2, -3, … on a clash and avoiding reserved words. Returns '' if the name has
// no slug-able characters. Assumes an open DB connection.
async function uniqueCompanySlug(name: string): Promise<string> {
  const base = slugifyCompanyName(name)
  if (!base) return ''
  let candidate = base
  let n = 1
  while (RESERVED_SLUGS.includes(candidate) || (await Company.findOne({ slug: candidate }).select('_id').lean())) {
    n += 1
    candidate = `${base}-${n}`
  }
  return candidate
}

export async function GET() {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  await connectDB()
  // The demo tenant is public/seeded — hide it from the real customer list.
  const companies = await Company.find({ slug: { $ne: DEMO_SLUG } }).sort({ createdAt: -1 }).lean()

  // Attach each company's owner email/name so the superadmin can see the login
  // they created at a glance (one query, then map in memory).
  const owners = await Admin.find({
    role: 'owner',
    companyId: { $in: companies.map(c => c._id) },
  }).select('companyId name email').lean()

  const ownerByCompany = new Map(owners.map(o => [String(o.companyId), o]))
  const withOwners = companies.map(c => {
    const owner = ownerByCompany.get(String(c._id))
    return { ...c, ownerEmail: owner?.email ?? '', ownerName: owner?.name ?? '' }
  })

  return Response.json(withOwners)
}

// Creates a Company AND its first Owner admin account in one step — a company
// is useless to its customer without someone able to log in and run it.
export async function POST(req: NextRequest) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const plan = typeof body.plan === 'string' ? body.plan.trim().toLowerCase() : ''
    // "Full name" — the person we deal with; used for both the company contact
    // and the owner login's display name.
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : ''
    const paymentStatus: PaymentStatus = isPaymentStatus(body.paymentStatus) ? body.paymentStatus : 'pending'
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    const ownerEmail = typeof body.ownerEmail === 'string' ? body.ownerEmail.toLowerCase().trim() : ''
    const ownerPassword = typeof body.ownerPassword === 'string' ? body.ownerPassword : ''

    if (!name) return Response.json({ error: 'Company name is required' }, { status: 400 })
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
      return Response.json({ error: 'A valid expiry date is required' }, { status: 400 })
    }
    if (!fullName) return Response.json({ error: 'Full name is required' }, { status: 400 })
    if (!ownerEmail || !ownerPassword) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (!isBronitEmail(ownerEmail)) {
      return Response.json({ error: 'Owner email must end with @bronit.uz' }, { status: 400 })
    }
    if (ownerPassword.length < 6) {
      return Response.json({ error: 'Owner password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    const planDoc = await Plan.findOne({ key: plan })
    if (!planDoc) return Response.json({ error: 'Unknown plan' }, { status: 400 })

    // Features default to the plan's tier defaults, but the superadmin may
    // override them per-business (checkboxes in the create form).
    const features =
      body.features !== undefined
        ? normalizeFeatures(body.features)
        : normalizeFeatures(planDoc.features)

    const emailClash = await Admin.findOne({ email: ownerEmail })
    if (emailClash) return Response.json({ error: 'An account with that email already exists' }, { status: 409 })

    // Slug is derived from the name (no longer entered by hand) and made unique
    // by appending -2, -3, … since it's still the internal routing identifier.
    const slug = await uniqueCompanySlug(name)
    if (!slug) return Response.json({ error: 'Could not derive a URL from that company name — use letters or numbers' }, { status: 400 })

    const company = await Company.create({ name, slug, plan, features, expiresAt, contactName: fullName, paymentMethod, paymentStatus, note })
    const owner = await Admin.create({
      name: fullName,
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
