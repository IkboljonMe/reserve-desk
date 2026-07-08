import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { getSession, requireOwner } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  // Owner sees all hotels; an admin only their own.
  const filter = session.role === 'owner' ? {} : { _id: session.hotelId }
  const hotels = await Hotel.find(filter).sort({ name: 1 })
  return NextResponse.json(hotels)
}

export async function POST(req: Request) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  await connectDB()
  const body = await req.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const shortName = typeof body.shortName === 'string' ? body.shortName.trim().toUpperCase() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const roomTypes = Array.isArray(body.roomTypes) ? body.roomTypes.map((t: any) => String(t).trim()).filter(Boolean) : []

  if (!name) return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
  if (!shortName) return NextResponse.json({ error: 'Short name is required' }, { status: 400 })
  if (!/^[A-Z0-9]{2,6}$/.test(shortName)) {
    return NextResponse.json(
      { error: 'Short name must be 2–6 letters or digits (e.g. FG, FGH1)' },
      { status: 400 }
    )
  }

  // Enforce uniqueness of the compact code (case-insensitive).
  const existing = await Hotel.findOne({ shortName })
  if (existing) {
    return NextResponse.json({ error: `Short name "${shortName}" is already taken` }, { status: 409 })
  }

  try {
    const hotel = await Hotel.create({ name, shortName, location, roomTypes })
    return NextResponse.json(hotel, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: `Short name "${shortName}" is already taken` }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 })
  }
}
