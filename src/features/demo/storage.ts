'use client'

// Everything the demo "books" lives only in this browser's localStorage —
// there is no server, no database, nothing shared between visitors.

const SESSION_KEY = 'easyServiceDemoSession'
const BOOKINGS_KEY = 'easyServiceDemoBookings'

export interface DemoSession {
  hotelId: string
  staffName: string
}

export interface DemoBooking {
  id: string
  hotelId: string
  serviceId: string
  serviceName: string
  customerName: string
  date: string
  time: string
  price: number
  createdAt: string
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as DemoSession) : null
  } catch {
    return null
  }
}

export function setDemoSession(session: DemoSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearDemoSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

export function getDemoBookings(hotelId: string): DemoBooking[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(BOOKINGS_KEY)
    const all = raw ? (JSON.parse(raw) as DemoBooking[]) : []
    return all.filter(b => b.hotelId === hotelId)
  } catch {
    return []
  }
}

export function addDemoBooking(booking: DemoBooking) {
  const raw = window.localStorage.getItem(BOOKINGS_KEY)
  const all: DemoBooking[] = raw ? JSON.parse(raw) : []
  all.push(booking)
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all))
}

export function removeDemoBooking(id: string) {
  const raw = window.localStorage.getItem(BOOKINGS_KEY)
  const all: DemoBooking[] = raw ? JSON.parse(raw) : []
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all.filter(b => b.id !== id)))
}
