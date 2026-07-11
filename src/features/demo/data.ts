// Fully hardcoded demo fixtures — no database, no API calls. The whole demo
// runs client-side; anything a visitor "books" is written to their own
// browser's localStorage only (see storage.ts), never persisted anywhere else.

export interface DemoStaff {
  email: string
  password: string
  name: string
}

export interface DemoService {
  id: string
  name: string
  icon: string
  price: number
  durationMinutes: number
}

export interface DemoHotel {
  id: string
  name: string
  location: string
  rooms: { number: string; floor: number; type: string }[]
  staff: DemoStaff[]
  services: DemoService[]
}

export const DEMO_HOTELS: DemoHotel[] = [
  {
    id: 'tashkent-grand',
    name: 'Tashkent Grand Hotel',
    location: 'Tashkent, Uzbekistan',
    rooms: [
      { number: '101', floor: 1, type: 'Standard' },
      { number: '102', floor: 1, type: 'Standard' },
      { number: '201', floor: 2, type: 'Lux' },
      { number: '202', floor: 2, type: 'Lux' },
    ],
    staff: [
      { email: 'admin@tashkent-grand.demo', password: 'demo123', name: 'Dilnoza Karimova' },
    ],
    services: [
      { id: 'spa', name: 'Spa & Sauna', icon: 'sparkles', price: 150000, durationMinutes: 60 },
      { id: 'restaurant', name: 'Restaurant Table', icon: 'utensils', price: 0, durationMinutes: 90 },
      { id: 'conference', name: 'Conference Hall', icon: 'presentation', price: 400000, durationMinutes: 120 },
    ],
  },
  {
    id: 'fergana',
    name: 'Fergana Hotel',
    location: 'Fergana, Uzbekistan',
    rooms: [
      { number: '01', floor: 1, type: 'Standard' },
      { number: '02', floor: 1, type: 'Standard' },
      { number: '11', floor: 2, type: 'Middle' },
    ],
    staff: [
      { email: 'admin@fergana.demo', password: 'demo123', name: 'Bekzod Yusupov' },
    ],
    services: [
      { id: 'pool', name: 'Swimming Pool', icon: 'waves', price: 80000, durationMinutes: 60 },
      { id: 'gym', name: 'Gym', icon: 'dumbbell', price: 50000, durationMinutes: 60 },
    ],
  },
]

export function findDemoStaff(email: string, password: string) {
  for (const hotel of DEMO_HOTELS) {
    const staff = hotel.staff.find(s => s.email === email && s.password === password)
    if (staff) return { hotel, staff }
  }
  return null
}
