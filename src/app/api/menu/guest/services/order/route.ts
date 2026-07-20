import { NextRequest } from 'next/server'
import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { GuestService } from '@/models/GuestService'
import { notifyHubMessage } from '@/lib/telegram'

// PUBLIC (no auth) — a guest requests a GuestService from their in-room tablet/phone.
// The message is posted directly to the hotel's telegram HUB topic so reception can process it.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const roomNumber = String(body.room || '').trim()
    const hotelSlug = String(body.hotel || '').trim()
    const serviceId = String(body.serviceId || '').trim()
    
    if (!roomNumber) return Response.json({ error: 'Room is required' }, { status: 400 })
    if (!hotelSlug) return Response.json({ error: 'Unknown hotel' }, { status: 400 })
    if (!serviceId) return Response.json({ error: 'Unknown service' }, { status: 400 })

    await connectDB()
    const hotel = await Hotel.findOne({ slug: hotelSlug })
      .select('_id name shortName companyId')
      .lean<{ _id: Types.ObjectId; name: string; shortName: string; companyId: Types.ObjectId } | null>()
    if (!hotel) return Response.json({ error: 'Unknown hotel' }, { status: 404 })

    const service = await GuestService.findOne({ _id: serviceId, hotelId: hotel._id })
      .select('name price')
      .lean<{ name: string; price: number } | null>()
    if (!service) return Response.json({ error: 'Unknown service' }, { status: 404 })

    const guestName = typeof body.guestName === 'string' ? body.guestName.slice(0, 120) : ''
    const note = typeof body.note === 'string' ? body.note.slice(0, 500) : ''
    
    // Construct the notification text
    const lines = [
      '🛎️ <b>Новая заявка на услугу!</b>',
      '',
      `🏢 Отель: ${hotel.name || hotel.shortName}`,
      `🛏️ Номер: ${roomNumber}`,
    ]
    if (guestName) lines.push(`👤 Гость: ${guestName}`)
    lines.push(`🛠️ Услуга: ${service.name}`)
    if (note) lines.push('', `✍️ Примечание: ${note}`)
    
    const text = lines.join('\n')

    // Fire-and-forget to Telegram (we don't await this blocking the response, though here it's fast enough)
    await notifyHubMessage(hotel.companyId, hotel._id, text)

    return Response.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Failed to submit guest service request', err)
    return Response.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
