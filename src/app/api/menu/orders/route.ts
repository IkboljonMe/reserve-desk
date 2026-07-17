import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuOrder, ORDER_STATUSES, type OrderStatus } from '@/models/MenuOrder'
import { requireDashboard, hotelScope } from '@/lib/session'

// GET /api/menu/orders?hotelId=&status= — staff view of menu orders, scoped to
// the session (owner: whole company; admin: their hotel).
export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const filter: Record<string, unknown> = hotelScope(session)

  const status = searchParams.get('status')
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    filter.status = status as OrderStatus
  }
  const hotelId = searchParams.get('hotelId')
  if (hotelId && session.role === 'owner') filter.hotelId = hotelId

  await connectDB()
  const orders = await MenuOrder.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  return Response.json(orders)
}
