// Seeds (or fully RESETS) the public demo tenant: a "Demo Hotel Group" company
// with an owner login that's shown on the /demo page. Deletes and recreates
// ONLY this company's data — never touches any other tenant.
//
// Usage: npx tsx src/scripts/seed-demo.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { Admin } from '../models/Admin'
import { Hotel } from '../models/Hotel'
import { Room } from '../models/Room'
import { Service } from '../models/Service'
import { Client } from '../models/Client'
import { ClientGroup } from '../models/ClientGroup'
import { Contract } from '../models/Contract'
import { Booking } from '../models/Booking'
import { Company } from '../models/Company'
import { MenuCategory } from '../models/MenuCategory'
import { MenuProduct } from '../models/MenuProduct'
import { HotelMenuSettings } from '../models/HotelMenuSettings'
import { DEMO_SLUG, DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD } from '../features/demo/config'

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    // No .env.local — fall back to whatever is already in the environment.
  }
}

const pad = (n: number) => n.toString().padStart(2, '0')
const dateStr = (offsetDays: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function main() {
  loadEnvLocal()
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set (checked .env.local and process.env)')

  console.log('Connecting to MongoDB…')
  await mongoose.connect(uri)

  // Wipe ONLY the previous demo tenant (scoped by its companyId).
  const existing = await Company.findOne({ slug: DEMO_SLUG })
  if (existing) {
    const cid = existing._id
    console.log(`Resetting existing demo company (${cid})…`)
    await Promise.all([
      Booking.deleteMany({ companyId: cid }),
      Contract.deleteMany({ companyId: cid }),
      Client.deleteMany({ companyId: cid }),
      ClientGroup.deleteMany({ companyId: cid }),
      Service.deleteMany({ companyId: cid }),
      Room.deleteMany({ companyId: cid }),
      MenuProduct.deleteMany({ companyId: cid }),
      MenuCategory.deleteMany({ companyId: cid }),
      HotelMenuSettings.deleteMany({ companyId: cid }),
      Hotel.deleteMany({ companyId: cid }),
      Admin.deleteMany({ companyId: cid }),
    ])
    await Company.deleteOne({ _id: cid })
  }

  const company = await Company.create({
    name: 'Demo Hotel Group',
    slug: DEMO_SLUG,
    plan: 'vip',
    expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    contactName: 'Bronit Demo',
    contactPhone: '+998 90 000 00 00',
    paymentMethod: 'demo',
  })
  const cid = company._id

  const owner = await Admin.create({
    name: 'Demo Owner',
    email: DEMO_OWNER_EMAIL,
    password: DEMO_OWNER_PASSWORD,
    role: 'owner',
    companyId: cid,
    hotelId: null,
  })

  const [tashkent, fergana] = await Hotel.create([
    { companyId: cid, name: 'Bronit Hotel', shortName: 'BR', location: 'Tashkent, Uzbekistan', roomTypes: ['Standard', 'Lux'] },
    { companyId: cid, name: 'Fergana Hotel', shortName: 'FH', location: 'Fergana, Uzbekistan', roomTypes: ['Standard', 'Middle'] },
  ])

  await Admin.create({
    name: 'Demo Admin (Tashkent)',
    email: 'demo-admin@bronit.uz',
    password: DEMO_OWNER_PASSWORD,
    role: 'admin',
    companyId: cid,
    hotelId: tashkent._id,
  })

  await Room.create([
    { companyId: cid, hotelId: tashkent._id, number: '101', floor: 1, type: 'Standard', order: 0 },
    { companyId: cid, hotelId: tashkent._id, number: '102', floor: 1, type: 'Standard', order: 1 },
    { companyId: cid, hotelId: tashkent._id, number: '201', floor: 2, type: 'Lux', order: 0 },
    { companyId: cid, hotelId: fergana._id, number: '01', floor: 1, type: 'Standard', order: 0 },
    { companyId: cid, hotelId: fergana._id, number: '11', floor: 2, type: 'Middle', order: 0 },
  ])

  // Room-service menu — the /demo hub's "Menu" card points here (guest URL:
  // demo.bronit.uz/<locale>/menu/bronit-hotel?room=101). Branded with the real
  // Bronit logo/banner assets so the demo looks like our own product, not a
  // placeholder hotel.
  await HotelMenuSettings.create({
    companyId: cid, hotelId: tashkent._id,
    menuEnabled: true, serviceFeeType: 'percent', serviceFeeValue: 10, preorderEnabled: false,
    logoUrl: '/assets/bronit-logo.png', bannerUrl: '/assets/hero-banner.png',
  })

  const [breakfast, drinks, snacks] = await MenuCategory.create([
    { companyId: cid, hotelId: tashkent._id, name: 'Breakfast', sourceLang: 'en', nameI18n: { en: 'Breakfast', ru: 'Завтрак', uz: 'Nonushta' }, sortOrder: 0 },
    { companyId: cid, hotelId: tashkent._id, name: 'Drinks', sourceLang: 'en', nameI18n: { en: 'Drinks', ru: 'Напитки', uz: 'Ichimliklar' }, sortOrder: 1 },
    { companyId: cid, hotelId: tashkent._id, name: 'Snacks', sourceLang: 'en', nameI18n: { en: 'Snacks', ru: 'Закуски', uz: 'Gazaklar' }, sortOrder: 2 },
  ] as never[])

  const menuItem = (categoryId: mongoose.Types.ObjectId, name: string, nameI18n: { ru: string; uz: string }, price: number, sortOrder: number) => ({
    companyId: cid, hotelId: tashkent._id, categoryId,
    name, sourceLang: 'en', nameI18n: { en: name, ru: nameI18n.ru, uz: nameI18n.uz },
    description: '', price, available: true, sortOrder,
  })

  await MenuProduct.create([
    menuItem(breakfast._id, 'Continental Breakfast', { ru: 'Континентальный завтрак', uz: "Kontinental nonushta" }, 45000, 0),
    menuItem(breakfast._id, 'Omelette & Toast', { ru: 'Омлет с тостами', uz: 'Omlet va tost' }, 35000, 1),
    menuItem(drinks._id, 'Fresh Orange Juice', { ru: 'Свежевыжатый апельсиновый сок', uz: "Yangi siqilgan apelsin sharbati" }, 20000, 0),
    menuItem(drinks._id, 'Uzbek Green Tea', { ru: 'Узбекский зелёный чай', uz: "O'zbek ko'k choyi" }, 10000, 1),
    menuItem(snacks._id, 'Club Sandwich', { ru: 'Клаб-сэндвич', uz: 'Klub sendvich' }, 40000, 0),
    menuItem(snacks._id, 'Samsa (2 pcs)', { ru: 'Самса (2 шт)', uz: 'Somsa (2 dona)' }, 18000, 1),
  ] as never[])

  const groups = await ClientGroup.create([
    { companyId: cid, name: 'VIP Guests', color: '#7c3aed', order: 0 },
    { companyId: cid, name: 'Corporate', color: '#0ea5e9', order: 1 },
  ])

  const [spa, hall, pool] = await Service.create([
    {
      companyId: cid, hotelId: tashkent._id, name: 'Spa & Sauna', icon: 'sparkles',
      openTime: '09:00', closeTime: '21:00', slotDuration: 60, capacity: 1,
      price: 150000, color: '#7c3aed', bufferTimeAfter: 15,
    },
    {
      companyId: cid, hotelId: tashkent._id, name: 'Conference Hall', icon: 'presentation',
      openTime: '08:00', closeTime: '20:00', slotDuration: 60, capacity: 1,
      price: 400000, color: '#0ea5e9',
    },
    {
      companyId: cid, hotelId: fergana._id, name: 'Swimming Pool', icon: 'waves',
      openTime: '07:00', closeTime: '22:00', slotDuration: 60, capacity: 4,
      price: 80000, color: '#10b981',
    },
  ])

  const clients = await Client.create([
    { companyId: cid, name: 'Aziz Toshpulatov', phone: '+998 90 123 45 67', roomNumber: '101', floor: 1, groupId: groups[0]._id },
    { companyId: cid, name: 'Malika Yusupova', phone: '+998 91 234 56 78', roomNumber: '201', floor: 2, groupId: groups[1]._id },
  ])

  const mkBooking = (svc: typeof spa, hotelId: mongoose.Types.ObjectId, day: number, start: string, end: string, name: string, price: number, paid: boolean) => ({
    companyId: cid, hotelId, bookedByHotelId: hotelId,
    serviceId: svc._id, customerName: name,
    date: dateStr(day), startTime: start, endTime: end, bufferedEndTime: end,
    duration: 60, totalPrice: price, status: 'confirmed', paid,
    amountPaid: paid ? price : 0,
    paidAt: paid ? new Date() : null,
    history: [{ action: 'created', at: new Date(), by: owner._id }],
    createdBy: owner._id,
  })

  await Booking.create([
    mkBooking(spa, tashkent._id, 0, '10:00', '11:00', clients[0].name, 150000, true),
    mkBooking(spa, tashkent._id, 0, '14:00', '15:00', 'Walk-in Guest', 150000, false),
    mkBooking(hall, tashkent._id, 1, '09:00', '12:00', clients[1].name, 1200000, true),
    mkBooking(pool, fergana._id, 0, '18:00', '19:00', 'Hotel Guest', 80000, false),
    mkBooking(spa, tashkent._id, -1, '16:00', '17:00', clients[0].name, 150000, true),
  ] as never[])

  await Contract.create({
    companyId: cid, hotelId: tashkent._id,
    organizationName: 'UzTech Solutions LLC', inn: '123456789',
    representativeName: 'Bobur Aliyev', phone: '+998 93 111 22 33',
    contractNumber: 'DEMO-2026-01', signDate: new Date(),
    finishDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: 'signed',
  })

  console.log('✅ Demo tenant seeded.')
  console.log(`   Dashboard: /secure/company/${DEMO_SLUG}/dashboard`)
  console.log(`   Owner: ${DEMO_OWNER_EMAIL} / ${DEMO_OWNER_PASSWORD}`)
  console.log(`   Menu: /menu/${tashkent.slug}?room=101 (on the demo. subdomain)`)

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Seed failed:', err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
