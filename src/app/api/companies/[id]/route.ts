import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Company, RESERVED_SLUGS, SLUG_PATTERN } from '@/models/Company'
import { Hotel } from '@/models/Hotel'
import { Admin } from '@/models/Admin'
import { Plan } from '@/models/Plan'
import { requireSuperadmin } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const body = await req.json()

    const update: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
    if (typeof body.slug === 'string' && body.slug.trim()) {
      const slug = body.slug.trim().toLowerCase()
      if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.includes(slug)) {
        return Response.json({ error: 'Invalid slug' }, { status: 400 })
      }
      update.slug = slug
    }
    if (typeof body.plan === 'string' && body.plan.trim()) update.plan = body.plan.trim().toLowerCase()
    if (body.expiresAt) {
      const d = new Date(body.expiresAt)
      if (Number.isNaN(d.getTime())) return Response.json({ error: 'Invalid expiry date' }, { status: 400 })
      update.expiresAt = d
    }
    // "Full name" edits the company contact name (owner login name is managed
    // via the accounts modal, not here).
    if (typeof body.fullName === 'string') update.contactName = body.fullName.trim()
    else if (typeof body.contactName === 'string') update.contactName = body.contactName.trim()
    if (typeof body.contactPhone === 'string') update.contactPhone = body.contactPhone.trim()
    if (typeof body.paymentMethod === 'string') update.paymentMethod = body.paymentMethod.trim()
    if (typeof body.note === 'string') update.note = body.note.trim()

    await connectDB()

    if (update.plan) {
      const planDoc = await Plan.findOne({ key: update.plan })
      if (!planDoc) return Response.json({ error: 'Unknown plan' }, { status: 400 })
    }

    const company = await Company.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    if (!company) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(company)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return Response.json({ error: 'That slug is already taken' }, { status: 409 })
    }
    console.error(err)
    return Response.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  const { id } = await params
  await connectDB()

  // Refuse to silently orphan a company's data — it must be emptied of hotels
  // (and, transitively, everything under them) before it can be removed.
  const hotelCount = await Hotel.countDocuments({ companyId: id })
  if (hotelCount > 0) {
    return Response.json(
      { error: `This company still has ${hotelCount} hotel(s). Remove them first, or deactivate the company instead of deleting it.` },
      { status: 409 }
    )
  }

  const company = await Company.findByIdAndDelete(id)
  if (!company) return Response.json({ error: 'Not found' }, { status: 404 })
  // A hotel-less company can still have owner/admin accounts — remove them so
  // their emails are freed and no orphaned logins remain.
  await Admin.deleteMany({ companyId: id })
  return Response.json({ ok: true })
}
