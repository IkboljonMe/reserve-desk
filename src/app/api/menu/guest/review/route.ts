import { NextRequest } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { MenuOrder } from '@/models/MenuOrder'
import { GuestReview } from '@/models/GuestReview'

// PUBLIC (no auth) — a guest leaves an optional review after ordering. Rating
// is required (1..5); comment is optional. Room/guest are copied from the
// linked order when an orderId is given so the feedback has context.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const hotelSlug = String(body.hotel || '').trim()
    const rating = Math.round(Number(body.rating) || 0)
    if (!hotelSlug) return Response.json({ error: 'Unknown hotel' }, { status: 400 })
    if (rating < 1 || rating > 5) return Response.json({ error: 'Rating must be 1..5' }, { status: 400 })

    await connectDB()
    const hotel = await Hotel.findOne({ slug: hotelSlug })
      .select('_id companyId')
      .lean<{ _id: Types.ObjectId; companyId: Types.ObjectId } | null>()
    if (!hotel) return Response.json({ error: 'Unknown hotel' }, { status: 404 })

    const comment = typeof body.comment === 'string' ? body.comment.slice(0, 1000) : ''
    let roomNumber = typeof body.room === 'string' ? body.room.slice(0, 40) : ''
    let guestName = ''
    let orderId: Types.ObjectId | undefined

    // Link to the order when provided, pulling its room/guest for context.
    const rawOrderId = String(body.orderId || '').trim()
    if (rawOrderId) {
      const order = await MenuOrder.findOne({ _id: rawOrderId, hotelId: hotel._id })
        .select('_id roomNumber guestName')
        .lean<{ _id: Types.ObjectId; roomNumber: string; guestName: string } | null>()
      if (order) {
        orderId = order._id
        roomNumber = roomNumber || order.roomNumber
        guestName = order.guestName || ''
      }
    }

    await GuestReview.create({
      companyId: hotel.companyId,
      hotelId: hotel._id,
      orderId,
      roomNumber,
      guestName,
      rating,
      comment,
    })

    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('Failed to save guest review', err)
    return Response.json({ error: 'Failed to save review' }, { status: 500 })
  }
}
