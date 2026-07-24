import { NextRequest } from 'next/server'
import { addMonths, addYears } from 'date-fns'
import { connectDB } from '@/lib/mongodb'
import { Order } from '@/models/Order'
import { Company, RESERVED_SLUGS, slugifyCompanyName } from '@/models/Company'
import { Admin } from '@/models/Admin'
import { requireSuperadmin } from '@/lib/session'
import { isBronitEmail } from '@/lib/bronitEmail'
import { featuresFromLines } from '@/lib/offerings'
import { nowUZ } from '@/lib/timezone'

// Derive a unique company slug from a name (append -2, -3, … on a clash).
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

// Turn an accepted order into a live business: a Company enabling exactly the
// order's modules, plus its first owner login. Idempotent-guarded — an order
// can only be provisioned once.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const body = await req.json()
    const ownerEmail = typeof body.ownerEmail === 'string' ? body.ownerEmail.toLowerCase().trim() : ''
    const ownerPassword = typeof body.ownerPassword === 'string' ? body.ownerPassword : ''

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
    const order = await Order.findById(id)
    if (!order) return Response.json({ error: 'Not found' }, { status: 404 })
    if (order.status === 'provisioned' || order.companyId) {
      return Response.json({ error: 'This order has already been provisioned' }, { status: 409 })
    }

    const emailClash = await Admin.findOne({ email: ownerEmail })
    if (emailClash) return Response.json({ error: 'An account with that email already exists' }, { status: 409 })

    const slug = await uniqueCompanySlug(order.businessName)
    if (!slug) return Response.json({ error: 'Could not derive a URL from the business name — use letters or numbers' }, { status: 400 })

    const features = featuresFromLines(order.lines)
    // Expiry follows the billing cycle they signed up for.
    const expiresAt = order.billingCycle === 'yearly' ? addYears(nowUZ(), 1) : addMonths(nowUZ(), 1)

    const company = await Company.create({
      name: order.businessName,
      slug,
      plan: 'custom',
      features,
      expiresAt,
      contactName: order.contactName,
      contactPhone: order.contactPhone,
      paymentMethod: order.paymentMethod,
      paymentStatus: 'paid',
    })

    const owner = await Admin.create({
      name: order.contactName || order.businessName,
      email: ownerEmail,
      password: ownerPassword,
      role: 'owner',
      companyId: company._id,
      hotelId: null,
    })

    order.status = 'provisioned'
    order.companyId = company._id
    await order.save()

    return Response.json(
      { company, owner: { _id: owner._id, name: owner.name, email: owner.email } },
      { status: 201 },
    )
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return Response.json({ error: 'Slug or email already in use' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to provision business' }, { status: 500 })
  }
}
