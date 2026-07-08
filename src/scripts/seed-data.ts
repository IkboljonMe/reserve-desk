import mongoose from 'mongoose'
import { Hotel } from '../models/Hotel'
import { Room } from '../models/Room'
import { Service } from '../models/Service'
import { ClientGroup } from '../models/ClientGroup'

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reservedesk'
  console.log('Connecting to database at:', uri)
  await mongoose.connect(uri)

  // 1. Create Safir Hotel
  console.log('Seeding Safir Hotel...')
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
  console.log('✅ Safir Hotel ready:', safirHotel._id.toString())

  // 2. Seed rooms for Safir Hotel
  console.log('Seeding rooms...')
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
  console.log('✅ Rooms seeded!')

  // 3. Seed Client Groups
  console.log('Seeding Client Groups...')
  const vipGroup = await ClientGroup.findOneAndUpdate(
    { name: 'VIP Clients' },
    { name: 'VIP Clients', color: '#f59e0b', order: 1 },
    { upsert: true, new: true }
  )
  const regularGroup = await ClientGroup.findOneAndUpdate(
    { name: 'Regular Clients' },
    { name: 'Regular Clients', color: '#3b82f6', order: 2 },
    { upsert: true, new: true }
  )
  console.log('✅ Client Groups ready!')

  // 4. Seed Services
  console.log('Seeding services...')
  
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
        // Free for guests booked room from hotel (Standard, Middle, Lux)
        { target: 'room', category: 'Standard', rows: [{ duration: 60, price: 0 }] },
        { target: 'room', category: 'Middle', rows: [{ duration: 60, price: 0 }] },
        { target: 'room', category: 'Lux', rows: [{ duration: 60, price: 0 }] },
        // VIP Clients discount (225K)
        { target: 'client', category: vipGroup._id.toString(), rows: [{ duration: 60, price: 225000 }] },
        // Regular Clients setting price (450K)
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

  console.log('✅ Services seeded successfully!')
  await mongoose.disconnect()
  console.log('Disconnected from database.')
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
