import { NextRequest, after } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { MenuProduct } from '@/models/MenuProduct'
import { MenuOrder } from '@/models/MenuOrder'
import { HotelMenuSettings } from '@/models/HotelMenuSettings'
import { computeServiceFee } from '@/lib/menu'
import { notifyNewMenuOrder } from '@/lib/telegram'

// PUBLIC (no auth) — a guest places an order from the in-room menu.
// The hotel is resolved from body.hotel (globally-unique slug); the company
// is taken from hotel.companyId. Prices/names are snapshotted server-side.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const roomNumber = String(body.room || '').trim()
    const items = Array.isArray(body.items) ? body.items : []
    if (!roomNumber) return Response.json({ error: 'Room is required' }, { status: 400 })
    if (items.length === 0) return Response.json({ error: 'Cart is empty' }, { status: 400 })

    const hotelSlug = String(body.hotel || '').trim()
    if (!hotelSlug) return Response.json({ error: 'Unknown hotel' }, { status: 400 })

    await connectDB()
    const hotel = await Hotel.findOne({ slug: hotelSlug })
      .select('_id slug companyId')
      .lean<{ _id: Types.ObjectId; slug?: string; companyId: Types.ObjectId } | null>()
    if (!hotel) return Response.json({ error: 'Unknown hotel' }, { status: 404 })

    // Sum requested quantities per product id.
    const qtyById = new Map<string, number>()
    for (const it of items) {
      const id = String(it.productId || '')
      const qty = Math.max(0, Math.round(Number(it.quantity) || 0))
      if (id && qty > 0) qtyById.set(id, (qtyById.get(id) || 0) + qty)
    }
    if (qtyById.size === 0) return Response.json({ error: 'Cart is empty' }, { status: 400 })

    // Load the real, available products for this hotel to snapshot name + price.
    const products = await MenuProduct.find({
      _id: { $in: [...qtyById.keys()] },
      companyId: hotel.companyId,
      hotelId: hotel._id,
      available: true,
    }).select('_id name price').lean<Array<{ _id: Types.ObjectId; name: string; price: number }>>()

    const orderItems = products.map(p => ({
      productId: p._id,
      name: p.name,
      price: p.price,
      quantity: qtyById.get(String(p._id)) || 1,
    }))
    if (orderItems.length === 0) return Response.json({ error: 'No valid items' }, { status: 400 })

    const subtotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
    const settings = await HotelMenuSettings.findOne({ hotelId: hotel._id })
      .select('serviceFeeType serviceFeeValue')
      .lean<{ serviceFeeType: 'none' | 'percent' | 'fixed'; serviceFeeValue: number } | null>()
    const serviceFee = settings ? computeServiceFee(subtotal, settings.serviceFeeType, settings.serviceFeeValue) : 0

    const order = await MenuOrder.create({
      companyId: hotel.companyId,
      hotelId: hotel._id,
      roomNumber,
      guestName: typeof body.guestName === 'string' ? body.guestName.slice(0, 120) : '',
      note: typeof body.note === 'string' ? body.note.slice(0, 500) : '',
      status: 'pending',
      items: orderItems,
      subtotal,
      serviceFee,
      total: subtotal + serviceFee,
    })

    after(async () => {
      const ref = await notifyNewMenuOrder({
        orderId: String(order._id),
        hotelId: hotel._id,
        roomNumber: order.roomNumber,
        guestName: order.guestName,
        note: order.note,
        status: order.status,
        items: orderItems,
        serviceFee: order.serviceFee,
        total: order.total,
      })
      // Remember where the message landed so a later status change can edit it.
      if (ref) {
        await MenuOrder.updateOne(
          { _id: order._id },
          { tgChatId: ref.chatId, tgMessageId: ref.messageId, tgThreadId: ref.messageThreadId ?? null },
        )
      }
    })

    return Response.json({ id: String(order._id), status: order.status, total: order.total }, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
