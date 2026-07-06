import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { Hotel } from '@/models/Hotel'

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reservedesk')
  const hotels = await Hotel.find().sort({ name: 1 })
  return NextResponse.json(hotels)
}

export async function POST(req: Request) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reservedesk')
  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const hotel = await Hotel.create(body)
  return NextResponse.json(hotel)
}
