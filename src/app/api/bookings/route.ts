import { NextRequest, after } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import { Service } from '@/models/Service'
import { requireDashboard } from '@/lib/session'
import { notifyNewBooking } from '@/lib/telegram'

// Fields kept when a booking on a shared service belongs to another hotel: the
// viewer needs to see the slot is occupied, but not the other hotel's guest data.
function maskBooking(b: Record<string, unknown>) {
  return {
    _id: b._id,
    serviceId: b.serviceId,
    date: b.date,
    startTime: b.startTime,
    endTime: b.endTime,
    bufferedEndTime: b.bufferedEndTime,
    duration: b.duration,
    status: b.status,
    masked: true,
    customerName: '',
    customerPhone: '',
    roomNumber: '',
    notes: '',
    totalPrice: 0,
    amountPaid: 0,
    paid: false,
    finished: false,
    history: [],
  }
}

export async function GET(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

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

  // The owner sees every booking. An admin sees bookings attributed to their
  // hotel PLUS bookings on any service shared with their hotel (so the shared
  // resource's occupancy is visible), then we mask the ones that aren't theirs.
  if (session.role !== 'owner') {
    const accessible = await Service.find({
      $or: [{ hotelId: session.hotelId }, { sharedHotelIds: session.hotelId }],
    }).select('_id').lean()
    filter.$or = [
      { hotelId: session.hotelId },
      { serviceId: { $in: accessible.map(s => s._id) } },
    ]
  }

  let query = Booking.find(filter)
    .populate('serviceId', 'name color')
    .sort({ date: 1, startTime: 1 })

  if (limit) query = query.limit(parseInt(limit))

  const bookings = await query.lean()

  // Owner-sees-all / others-see-busy: for an admin, redact bookings on a shared
  // service that neither their hotel owns (hotelId) nor made (bookedByHotelId).
  if (session.role !== 'owner') {
    const me = session.hotelId
    const masked = bookings.map(b =>
      String(b.hotelId) === me || String(b.bookedByHotelId) === me
        ? b
        : maskBooking(b as unknown as Record<string, unknown>)
    )
    return Response.json(masked)
  }

  return Response.json(bookings)
}

export async function POST(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  try {
    const body = await req.json()
    const { serviceId, clientId, customerName, customerPhone, roomNumber, date, startTime, endTime, notes, status, bookingType, category, variantId } = body

    if (!serviceId || !customerName || !date || !startTime || !endTime) {
      return Response.json({ error: 'serviceId, customerName, date, startTime, endTime are required' }, { status: 400 })
    }

    await connectDB()
    const service = await Service.findById(serviceId).lean()
    if (!service) return Response.json({ error: 'Service not found' }, { status: 404 })
    // Admins may book services their hotel owns OR that are shared with them;
    // the owner may book any service.
    const ownerHotelId = String(service.hotelId)
    const sharedIds = (service.sharedHotelIds ?? []).map(String)
    if (
      session.role !== 'owner' &&
      ownerHotelId !== session.hotelId &&
      !sharedIds.includes(session.hotelId!)
    ) {
      return Response.json({ error: 'Service not found' }, { status: 404 })
    }
    // Revenue/ownership is always attributed to the service's owner hotel, but we
    // record which hotel actually made the booking (for a shared resource this
    // may be a different, sharing hotel).
    const bookingHotelId = ownerHotelId
    const bookedByHotelId = session.role === 'owner' ? ownerHotelId : session.hotelId

    // Resolve the chosen variant from the service (authoritative name snapshot).
    const variant = variantId ? (service.variants ?? []).find(v => v.id === variantId) : null

    const [h, m] = endTime.split(':').map(Number)
    const totalM = h * 60 + m + (service.bufferTimeAfter || 0)
    const bufferedEndTime = `${Math.floor(totalM / 60).toString().padStart(2, '0')}:${(totalM % 60).toString().padStart(2, '0')}`

    const [sh, sm] = startTime.split(':').map(Number)
    const totalSM = sh * 60 + sm - (service.bufferTimeBefore || 0)
    const startH = Math.max(0, Math.floor(totalSM / 60))
    const startMin = Math.max(0, totalSM % 60)
    const bufferedStartTime = `${startH.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`

    // Capacity-aware availability: a service can host up to `capacity` bookings
    // at once. Count existing (non-cancelled) bookings whose raw [start,end]
    // overlaps this candidate's buffered window, and reject only once the slot
    // is full. capacity defaults to 1 (exclusive resource).
    const overlapCount = await Booking.countDocuments({
      serviceId,
      date,
      status: { $ne: 'cancelled' },
      startTime: { $lt: bufferedEndTime },
      endTime: { $gt: bufferedStartTime },
    })

    if (overlapCount >= (service.capacity || 1)) {
      return Response.json({ error: 'This time slot is fully booked for this service' }, { status: 409 })
    }

    const now = new Date()
    const total = body.totalPrice || 0
    // Payment can arrive in full, as a deposit (partial `amountPaid`), or not at
    // all. `paid` is derived — true only once the collected amount covers the total.
    let amountPaid = 0
    if (total > 0) {
      if (typeof body.amountPaid === 'number') amountPaid = Math.max(0, Math.min(total, body.amountPaid))
      else if (Boolean(body.paid)) amountPaid = total
    }
    const paid = total > 0 && amountPaid >= total
    const history = [
      { action: 'created', at: now, by: session.userId },
      ...(paid
        ? [{ action: 'paid', at: now, by: session.userId }]
        : amountPaid > 0
          ? [{ action: 'payment', at: now, by: session.userId, detail: String(amountPaid) }]
          : []),
    ]

    const booking = await Booking.create({
      hotelId: bookingHotelId,
      bookedByHotelId: bookedByHotelId ?? undefined,
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
      persons: Math.max(1, Number(body.persons) || 1),
      totalPrice: total,
      amountPaid,
      notes: notes || '',
      status: status || 'confirmed',
      paid,
      finished: false,
      bookingType: bookingType || undefined,
      category: category || '',
      variantId: variant?.id || '',
      variantName: variant?.name || '',
      paidAt: paid ? now : null,
      history: history as never,
      createdBy: session.userId,
    })

    const populated = await Booking.findById(booking._id).populate('serviceId', 'name color').lean()

    const serviceForNotify = populated!.serviceId as unknown as { _id: string; name: string }
    after(async () => {
      const ref = await notifyNewBooking({
        hotelId: bookingHotelId,
        serviceId: serviceForNotify,
        customerName,
        roomNumber,
        date,
        startTime,
        endTime,
        persons: Math.max(1, Number(body.persons) || 1),
        totalPrice: total,
        amountPaid,
        paid,
        createdByName: session.name,   // "who booked"
      })
      // Remember where the message landed so a later status change can edit it.
      if (ref) {
        await Booking.updateOne(
          { _id: booking._id },
          { tgChatId: ref.chatId, tgMessageId: ref.messageId, tgThreadId: ref.messageThreadId ?? null },
        )
      }
    })

    return Response.json(populated, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
