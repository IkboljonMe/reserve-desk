import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Hotel, HOTEL_SLUG_PATTERN, slugifyHotelName, isHotelSlugTaken } from '@/models/Hotel'
import { getSession, requireOwner, requireWritable } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.role === 'superadmin' || !session.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  // Owner sees every hotel in their company; an admin only their own.
  const filter = session.role === 'owner'
    ? { companyId: session.companyId }
    : { _id: session.hotelId, companyId: session.companyId }
  const hotels = await Hotel.find(filter).sort({ name: 1 })
  return NextResponse.json(hotels)
}

export async function POST(req: Request) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  await connectDB()
  const body = await req.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const shortName = typeof body.shortName === 'string' ? body.shortName.trim().toUpperCase() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const roomTypes = Array.isArray(body.roomTypes) ? body.roomTypes.map((t: unknown) => String(t).trim()).filter(Boolean) : []
  // Optional custom URL slug; the model's pre-save hook derives one from the
  // name when this is empty.
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''

  if (!name) return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
  if (!shortName) return NextResponse.json({ error: 'Short name is required' }, { status: 400 })
  if (!/^[A-Z0-9]{1,5}$/.test(shortName)) {
    return NextResponse.json(
      { error: 'Short name must be 1–5 letters or digits (e.g. F, FG, FGH1)' },
      { status: 400 }
    )
  }
  if (slug && !HOTEL_SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: 'Slug must be lowercase letters, numbers and hyphens' }, { status: 400 })
  }

  // Enforce uniqueness of the compact code within this company (case-insensitive).
  const existing = await Hotel.findOne({ shortName, companyId: session.companyId })
  if (existing) {
    return NextResponse.json({ error: `Short name "${shortName}" is already taken` }, { status: 409 })
  }

  // The slug is globally unique (public hub URL), so check across all companies.
  const effectiveSlug = slug || slugifyHotelName(name)
  if (await isHotelSlugTaken(effectiveSlug)) {
    return NextResponse.json({ error: `The URL "${effectiveSlug}" is already used by another hotel — pick a different slug` }, { status: 409 })
  }

  try {
    const hotel = await Hotel.create({ companyId: session.companyId, name, shortName, slug: slug || undefined, location, roomTypes })
    return NextResponse.json(hotel, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Short name or slug is already taken by another hotel' }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 })
  }
}
