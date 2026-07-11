import { NextRequest, after } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Service } from '@/models/Service'
import '@/models/Hotel'
import { getSession, requireOwner, requireWritable } from '@/lib/session'
import { sanitizeVariants } from '@/lib/serviceVariants'
import { ensureTopicForService } from '@/lib/telegram'

export async function GET() {
  const session = await getSession()
  if (!session || session.role === 'superadmin' || !session.companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Owner sees every hotel's services in their company; an admin sees services
  // their hotel owns OR that another hotel has shared with them.
  const filter = session.role === 'owner'
    ? { companyId: session.companyId }
    : { companyId: session.companyId, $or: [{ hotelId: session.hotelId }, { sharedHotelIds: session.hotelId }] }

  await connectDB()
  const services = await Service.find(filter).populate('hotelId').sort({ createdAt: -1 }).lean()
  return Response.json(services)
}

export async function POST(req: NextRequest) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  try {
    const body = await req.json()
    const { name, icon, description, hotelId, sharedHotelIds, openTime, closeTime, slotDuration, capacity, color, price, isFree, details, bufferTimeBefore, bufferTimeAfter, pricingPlans, pricingGroups, variants } = body

    if (!name || !openTime || !closeTime) {
      return Response.json({ error: 'Name, open time, and close time are required' }, { status: 400 })
    }

    // Sanitize shared hotels: unique, and never the owner hotel itself.
    const shared = Array.isArray(sharedHotelIds)
      ? [...new Set(sharedHotelIds.map(String))].filter(id => id && id !== String(hotelId || ''))
      : []

    await connectDB()
    const service = await Service.create({
      companyId: session.companyId,
      name, icon, description,
      hotelId: hotelId || null,
      sharedHotelIds: shared,
      openTime, closeTime,
      slotDuration: Number(slotDuration) || 60,
      capacity: Number(capacity) || 1,
      price: Number(price) || 0,
      isFree: Boolean(isFree),
      details: details || '',
      bufferTimeBefore: Number(bufferTimeBefore) || 0,
      bufferTimeAfter: Number(bufferTimeAfter) || 0,
      pricingPlans: Array.isArray(pricingPlans) ? pricingPlans : [],
      pricingGroups: Array.isArray(pricingGroups) ? pricingGroups : [],
      variants: sanitizeVariants(variants),
      color: color || '#6366f1',
    })

    if (service.hotelId) {
      after(() => ensureTopicForService(service.hotelId!, service._id))
    }

    return Response.json(service, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
