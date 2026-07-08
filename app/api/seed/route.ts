import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Hotel } from '@/models/Hotel'
import { Room } from '@/models/Room'
import { Service } from '@/models/Service'
import { ClientGroup } from '@/models/ClientGroup'
import { requireOwner } from '@/lib/session'

export async function POST() {
  const session = await requireOwner()
  if (session instanceof Response) return session

  try {
    await connectDB()

    // 1. Create Safir Hotel
    const safirHotel = await Hotel.findOneAndUpdate(
      { shortName: 'SF' },
      {
        name: 'Safir Hotel',
        shortName: 'SF',
        location: 'Tashkent, Uzbekistan',
        roomTypes: ['Standard', 'Middle', 'Lux'],
      },
      { upsert: true, new: true }
    )

    // 2. Seed rooms for Safir Hotel
    const roomsToSeed = [
      { number: '101', floor: 1, type: 'Standard', description: 'Standard Room' },
      { number: '102', floor: 1, type: 'Standard', description: 'Standard Room' },
      { number: '201', floor: 2, type: 'Middle', description: 'Middle Room' },
      { number: '301', floor: 3, type: 'Lux', description: 'Luxurious Suite' },
    ]

    for (const r of roomsToSeed) {
      await Room.findOneAndUpdate(
        { hotelId: safirHotel._id, number: r.number },
        { ...r, hotelId: safirHotel._id },
        { upsert: true }
      )
    }

    // 3. Seed Client Groups
    const vipGroup = await ClientGroup.findOneAndUpdate(
      { hotelId: safirHotel._id, name: 'VIP Clients' },
      { hotelId: safirHotel._id, name: 'VIP Clients', color: '#f59e0b', order: 1 },
      { upsert: true, new: true }
    )
    const regularGroup = await ClientGroup.findOneAndUpdate(
      { hotelId: safirHotel._id, name: 'Regular Clients' },
      { hotelId: safirHotel._id, name: 'Regular Clients', color: '#3b82f6', order: 2 },
      { upsert: true, new: true }
    )

    // 4. Seed Services
    
    // A. Transfer Airport
    await Service.findOneAndUpdate(
      { name: 'Transfer Airport', hotelId: safirHotel._id },
      {
        name: 'Transfer Airport',
        icon: 'concierge',
        description: 'Comfortable transfer to and from airport',
        hotelId: safirHotel._id,
        openTime: '00:00',
        closeTime: '23:59',
        slotDuration: 60,
        capacity: 4,
        price: 150000,
        isFree: false,
        color: '#10b981',
        isActive: true,
        pricingPlans: [{ duration: 60, price: 150000 }],
        pricingGroups: [],
      },
      { upsert: true }
    )

    // B. SPA Pool
    await Service.findOneAndUpdate(
      { name: 'SPA Pool', hotelId: safirHotel._id },
      {
        name: 'SPA Pool',
        icon: 'droplet',
        description: 'SPA Pool with relaxation zones',
        hotelId: safirHotel._id,
        openTime: '07:00',
        closeTime: '22:00',
        slotDuration: 60,
        capacity: 6,
        price: 450000,
        isFree: false,
        color: '#3b82f6',
        isActive: true,
        pricingPlans: [{ duration: 60, price: 450000 }],
        pricingGroups: [
          { target: 'room', category: 'Standard', rows: [{ duration: 60, price: 0 }] },
          { target: 'room', category: 'Middle', rows: [{ duration: 60, price: 0 }] },
          { target: 'room', category: 'Lux', rows: [{ duration: 60, price: 0 }] },
          { target: 'client', category: vipGroup._id.toString(), rows: [{ duration: 60, price: 225000 }] },
          { target: 'client', category: regularGroup._id.toString(), rows: [{ duration: 60, price: 450000 }] },
        ],
      },
      { upsert: true }
    )

    // C. Small Conference Hall (1mln sum)
    await Service.findOneAndUpdate(
      { name: 'Small Conference Hall', hotelId: safirHotel._id },
      {
        name: 'Small Conference Hall',
        icon: 'meeting',
        description: 'Small Conference Hall for up to 20 people',
        hotelId: safirHotel._id,
        openTime: '08:00',
        closeTime: '22:00',
        slotDuration: 60,
        capacity: 1,
        price: 1000000,
        isFree: false,
        color: '#a855f7',
        isActive: true,
        pricingPlans: [{ duration: 60, price: 1000000 }],
        pricingGroups: [],
      },
      { upsert: true }
    )

    // D. Big Conference Hall (2.5mln sum)
    await Service.findOneAndUpdate(
      { name: 'Big Conference Hall', hotelId: safirHotel._id },
      {
        name: 'Big Conference Hall',
        icon: 'meeting',
        description: 'Big Conference Hall for up to 100 people',
        hotelId: safirHotel._id,
        openTime: '08:00',
        closeTime: '22:00',
        slotDuration: 60,
        capacity: 1,
        price: 2500000,
        isFree: false,
        color: '#ec4899',
        isActive: true,
        pricingPlans: [{ duration: 60, price: 2500000 }],
        pricingGroups: [],
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: 'Safir Hotel & Services seeded successfully' })
  } catch (error: any) {
    console.error('Database seeding failed:', error)
    return NextResponse.json({ error: error.message || 'Seeding failed' }, { status: 500 })
  }
}
