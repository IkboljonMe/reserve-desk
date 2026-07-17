import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuOrder, ORDER_STATUSES } from '@/models/MenuOrder'
import { requireDashboard, requireWritable, idScope } from '@/lib/session'

// PATCH /api/menu/orders/:id — advance an order's status (staff).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboard()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const status = body.status
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  await connectDB()
  const order = await MenuOrder.findOneAndUpdate(idScope(session, id), { status }, { new: true }).lean()
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(order)
}
