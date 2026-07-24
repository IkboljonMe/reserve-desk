import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Order, ORDER_STATUSES, type OrderStatus } from '@/models/Order'
import { requireSuperadmin } from '@/lib/session'
import { readOrderFields } from '@/lib/offerings'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  const { id } = await params
  await connectDB()
  const order = await Order.findById(id).lean()
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(order)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const body = await req.json()

    await connectDB()
    const existing = await Order.findById(id).select('status').lean<{ status: OrderStatus }>()
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })
    // A provisioned order is a historical record — its business already exists.
    if (existing.status === 'provisioned') {
      return Response.json({ error: 'This order has already been provisioned and cannot be edited' }, { status: 409 })
    }

    const fields = readOrderFields(body)
    if (!fields.businessName) return Response.json({ error: 'Business name is required' }, { status: 400 })
    if (fields.lines.length === 0) return Response.json({ error: 'Add at least one item to the order' }, { status: 400 })

    const update: Record<string, unknown> = { ...fields }
    // The superadmin may mark a quote accepted/cancelled from the list; only
    // provisioning (its own endpoint) may set 'provisioned'.
    if (typeof body.status === 'string' && ORDER_STATUSES.includes(body.status as OrderStatus) && body.status !== 'provisioned') {
      update.status = body.status
    }

    const order = await Order.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    if (!order) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(order)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperadmin()
  if (session instanceof Response) return session

  const { id } = await params
  await connectDB()
  const order = await Order.findByIdAndDelete(id)
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
