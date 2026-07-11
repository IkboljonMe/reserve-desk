import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Hotel, HOTEL_SLUG_PATTERN, slugifyHotelName } from '@/models/Hotel'
import { requireOwner, requireWritable } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  await connectDB()
  const { id } = await params
  const body = await req.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const shortName = typeof body.shortName === 'string' ? body.shortName.trim().toUpperCase() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const roomTypes = Array.isArray(body.roomTypes) ? body.roomTypes.map((t: unknown) => String(t).trim()).filter(Boolean) : []
  // Owner-editable URL slug; an emptied field falls back to the slugified name.
  const slug = typeof body.slug === 'string' && body.slug.trim()
    ? body.slug.trim().toLowerCase()
    : slugifyHotelName(name)

  if (!name) return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
  if (!shortName) return NextResponse.json({ error: 'Short name is required' }, { status: 400 })
  if (!/^[A-Z0-9]{1,5}$/.test(shortName)) {
    return NextResponse.json(
      { error: 'Short name must be 1–5 letters or digits (e.g. F, FG, FGH1)' },
      { status: 400 }
    )
  }
  if (!HOTEL_SLUG_PATTERN.test(slug)) {
    return NextResponse.json({ error: 'Slug must be lowercase letters, numbers and hyphens' }, { status: 400 })
  }

  // Enforce uniqueness of the compact code and slug against every *other*
  // hotel in this company.
  const clash = await Hotel.findOne({
    companyId: session.companyId,
    _id: { $ne: id },
    $or: [{ shortName }, { slug }],
  })
  if (clash) {
    return NextResponse.json({ error: 'Short name or slug is already taken by another hotel' }, { status: 409 })
  }

  try {
    const hotel = await Hotel.findOneAndUpdate(
      { _id: id, companyId: session.companyId },
      { name, shortName, slug, location, roomTypes },
      { new: true, runValidators: true }
    )
    if (!hotel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(hotel)
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Short name or slug is already taken by another hotel' }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Failed to update hotel' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session
  const blocked = await requireWritable(session)
  if (blocked) return blocked

  await connectDB()
  const { id } = await params
  const hotel = await Hotel.findOneAndDelete({ _id: id, companyId: session.companyId })
  if (!hotel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
