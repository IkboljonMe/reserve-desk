import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Service } from '@/models/Service'
import '@/models/Hotel'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const services = await Service.find().populate('hotelId').sort({ createdAt: -1 }).lean()
  return Response.json(services)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, icon, description, hotelId, openTime, closeTime, slotDuration, capacity, color, price, isFree, details, bufferTimeBefore, bufferTimeAfter, pricingPlans, pricingGroups } = body

    if (!name || !openTime || !closeTime) {
      return Response.json({ error: 'Name, open time, and close time are required' }, { status: 400 })
    }

    await connectDB()
    const service = await Service.create({
      name, icon, description,
      hotelId: hotelId || null,
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
      color: color || '#6366f1',
    })

    return Response.json(service, { status: 201 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
