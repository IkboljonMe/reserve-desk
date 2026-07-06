import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const serviceId = searchParams.get('serviceId')

  const filter: Record<string, unknown> = {}
  if (dateFrom && dateTo) {
    filter.date = { $gte: dateFrom, $lte: dateTo }
  } else if (dateFrom) {
    filter.date = dateFrom
  }
  if (serviceId) filter.serviceId = serviceId

  await connectDB()
  const bookings = await Booking.find(filter)
    .populate('serviceId', 'name color')
    .sort({ date: 1, startTime: 1 })
    .lean()

  return Response.json(bookings)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { serviceId, customerName, customerPhone, date, startTime, endTime, notes, status } = body

    if (!serviceId || !customerName || !date || !startTime || !endTime) {
      return Response.json({ error: 'serviceId, customerName, date, startTime, endTime are required' }, { status: 400 })
    }

    await connectDB()

    // Check for overlapping bookings (same service, same date, overlapping times)
    const overlapping = await Booking.findOne({
      serviceId,
      date,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    })

    if (overlapping) {
      return Response.json({ error: 'This time slot is already booked for this service' }, { status: 409 })
    }

    const booking = await Booking.create({
      serviceId, customerName, customerPhone, date, startTime, endTime,
      notes: notes || '',
      status: status || 'confirmed',
      createdBy: session.userId,
    })

    const populated = await Booking.findById(booking._id).populate('serviceId', 'name color').lean()
    return Response.json(populated, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
