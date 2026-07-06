import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { Hotel } from '@/models/Hotel'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reservedesk')
  const { id } = await params
  const hotel = await Hotel.findByIdAndDelete(id)
  if (!hotel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
