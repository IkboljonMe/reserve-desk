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
  const status = searchParams.get('status')
  const limit = searchParams.get('limit')

  const filter: Record<string, unknown> = {}
  if (dateFrom && dateTo) {
    filter.date = { $gte: dateFrom, $lte: dateTo }
  } else if (dateFrom) {
    filter.date = dateFrom
  }
  if (serviceId) filter.serviceId = serviceId
  if (status) filter.status = status

  await connectDB()
  let query = Booking.find(filter)
    .populate('serviceId', 'name color')
    .sort({ date: 1, startTime: 1 })

  if (limit) query = query.limit(parseInt(limit))

  const bookings = await query.lean()
  return Response.json(bookings)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { serviceId, clientId, customerName, customerPhone, roomNumber, date, startTime, endTime, notes, status } = body

    if (!serviceId || !customerName || !date || !startTime || !endTime) {
      return Response.json({ error: 'serviceId, customerName, date, startTime, endTime are required' }, { status: 400 })
    }

    await connectDB()
    const { Service } = await import('@/models/Service')
    const service = await Service.findById(serviceId).lean()
    if (!service) return Response.json({ error: 'Service not found' }, { status: 404 })

    const [h, m] = endTime.split(':').map(Number)
    const totalM = h * 60 + m + (service.bufferTimeAfter || 0)
    const bufferedEndTime = `${Math.floor(totalM / 60).toString().padStart(2, '0')}:${(totalM % 60).toString().padStart(2, '0')}`

    const [sh, sm] = startTime.split(':').map(Number)
    const totalSM = sh * 60 + sm - (service.bufferTimeBefore || 0)
    const startH = Math.max(0, Math.floor(totalSM / 60))
    const startMin = Math.max(0, totalSM % 60)
    const bufferedStartTime = `${startH.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`

    // Check for overlapping bookings (same service, same date, overlapping buffered times)
    const overlapping = await Booking.findOne({
      serviceId,
      date,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: bufferedEndTime }, endTime: { $gt: bufferedStartTime } },
      ],
    })

    if (overlapping) {
      return Response.json({ error: 'This time slot is already booked for this service' }, { status: 409 })
    }

    const booking = await Booking.create({
      serviceId,
      clientId: clientId || null,
      customerName,
      customerPhone: customerPhone || '',
      roomNumber: roomNumber || '',
      date,
      startTime,
      endTime,
      bufferedEndTime,
      duration: body.duration || 60,
      totalPrice: body.totalPrice || 0,
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
