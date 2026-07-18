import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Company } from '@/models/Company'
import { MenuOrder } from '@/models/MenuOrder'
import { getSubdomain } from '@/lib/subdomain'

// PUBLIC (no auth) — a guest polls their own order's status after placing it.
// The company is resolved from the request Host, same as the guest order POST
// route; the order must belong to that company or this 404s (no cross-tenant
// leakage from a guessed id).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const host = (await headers()).get('host') || ''
  const companySlug = getSubdomain(host)
  if (!companySlug) return Response.json({ error: 'Unknown hotel' }, { status: 400 })

  const { id } = await params

  await connectDB()
  const company = await Company.findOne({ slug: companySlug }).select('_id').lean<{ _id: Types.ObjectId } | null>()
  if (!company) return Response.json({ error: 'Unknown hotel' }, { status: 404 })

  const order = await MenuOrder.findOne({ _id: id, companyId: company._id })
    .select('status items subtotal serviceFee total roomNumber note createdAt')
    .lean()
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(order)
}
