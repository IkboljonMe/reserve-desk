import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { requireDashboard, hotelScope } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const serviceId = searchParams.get('serviceId')
  const status = searchParams.get('status')
  const limit = searchParams.get('limit')

  const filter: Record<string, unknown> = hotelScope(session)
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
  const session = await requireDashboard()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const { serviceId, clientId, customerName, customerPhone, roomNumber, date, startTime, endTime, notes, status, bookingType, category } = body

    if (!serviceId || !customerName || !date || !startTime || !endTime) {
      return Response.json({ error: 'serviceId, customerName, date, startTime, endTime are required' }, { status: 400 })
    }

    await connectDB()
    const { Service } = await import('@/models/Service')
    const service = await Service.findById(serviceId).lean()
    if (!service) return Response.json({ error: 'Service not found' }, { status: 404 })
    // Admins may only book services belonging to their own hotel; the owner may
    // book any service. Either way, the booking inherits the service's hotel.
    if (session.role !== 'owner' && String(service.hotelId) !== session.hotelId) {
      return Response.json({ error: 'Service not found' }, { status: 404 })
    }
    const bookingHotelId = String(service.hotelId)

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

    const now = new Date()
    const paid = Boolean(body.paid)
    const history = [
      { action: 'created', at: now, by: session.userId },
      ...(paid ? [{ action: 'paid', at: now, by: session.userId }] : []),
    ]

    const booking = await Booking.create({
      hotelId: bookingHotelId,
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
      paid,
      finished: false,
      bookingType: bookingType || undefined,
      category: category || '',
      paidAt: paid ? now : null,
      history: history as never,
      createdBy: session.userId,
    })

    const populated = await Booking.findById(booking._id).populate('serviceId', 'name color').lean()
    return Response.json(populated, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
