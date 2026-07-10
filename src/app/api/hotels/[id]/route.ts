import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { requireOwner } from '@/lib/session'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  await connectDB()
  const { id } = await params
  const body = await req.json()

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const shortName = typeof body.shortName === 'string' ? body.shortName.trim().toUpperCase() : ''
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const roomTypes = Array.isArray(body.roomTypes) ? body.roomTypes.map((t: any) => String(t).trim()).filter(Boolean) : []

  if (!name) return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
  if (!shortName) return NextResponse.json({ error: 'Short name is required' }, { status: 400 })
  if (!/^[A-Z0-9]{1,5}$/.test(shortName)) {
    return NextResponse.json(
      { error: 'Short name must be 1–5 letters or digits (e.g. F, FG, FGH1)' },
      { status: 400 }
    )
  }

  // Enforce uniqueness of the compact code against every *other* hotel.
  const clash = await Hotel.findOne({ shortName, _id: { $ne: id } })
  if (clash) {
    return NextResponse.json({ error: `Short name "${shortName}" is already taken` }, { status: 409 })
  }

  try {
    const hotel = await Hotel.findByIdAndUpdate(
      id,
      { name, shortName, location, roomTypes },
      { new: true, runValidators: true }
    )
    if (!hotel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(hotel)
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: `Short name "${shortName}" is already taken` }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Failed to update hotel' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner()
  if (session instanceof Response) return session

  await connectDB()
  const { id } = await params
  const hotel = await Hotel.findByIdAndDelete(id)
  if (!hotel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
