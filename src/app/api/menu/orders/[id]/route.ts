import { NextRequest, after } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MenuOrder, ORDER_STATUSES } from '@/models/MenuOrder'
import { requireDashboard, requireWritable, idScope } from '@/lib/session'
import { notifyMenuOrderUpdated } from '@/lib/telegram'

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

  // The status is shown in the Telegram message — edit it in place so the
  // group stays in sync (never post a duplicate). Best-effort, post-response.
  if (order.tgMessageId != null && order.tgChatId != null) {
    after(() =>
      notifyMenuOrderUpdated(
        { chatId: order.tgChatId!, messageId: order.tgMessageId!, messageThreadId: order.tgThreadId ?? undefined },
        {
          orderId: String(order._id),
          companyId: order.companyId,
          hotelId: order.hotelId,
          roomNumber: order.roomNumber,
          guestName: order.guestName,
          note: order.note,
          status: order.status,
          items: order.items,
          serviceFee: order.serviceFee,
          total: order.total,
        },
      )
    )
  }

  return Response.json(order)
}
