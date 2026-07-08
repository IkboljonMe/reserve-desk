export type HotelRef = { _id: string; name?: string; shortName?: string }

export interface Service {
  _id: string
  name: string
  color: string
  isActive: boolean
  hotelId?: string | HotelRef
}

export interface Hotel {
  _id: string
  name: string
  shortName: string
}

export interface Booking {
  _id: string
  serviceId: { _id: string; name: string; color: string }
  customerName: string
  customerPhone: string
  roomNumber: string
  date: string
  startTime: string
  endTime: string
  notes: string
  status: string
  totalPrice: number
  paid: boolean
  finished: boolean
  bookingType?: 'client' | 'room' | 'custom' | null
  duration?: number
  createdAt?: string
  updatedAt?: string
  createdBy?: any
  history?: any[]
  paidAt?: string | null
  finishedAt?: string | null
  masked?: boolean  // booking on a shared service owned/made by another hotel — details hidden
}

export const svcId = (b: Booking) => (typeof b.serviceId === 'string' ? b.serviceId : b.serviceId?._id)

export const extractHotelId = (h?: string | HotelRef) => (!h ? '' : typeof h === 'string' ? h : h._id || '')

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const fromMin = (min: number) =>
  `${Math.floor(min / 60).toString().padStart(2, '0')}:${(min % 60).toString().padStart(2, '0')}`

export const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

export type StateKey = 'finished' | 'free' | 'paid' | 'unpaid'

export function bookingState(b: Booking): { key: StateKey; label: string; color: string; badge: string; bg: string } {
  if (b.finished) return { key: 'finished', label: 'Finished', color: '#4f46e5', badge: 'badge-success', bg: '#eef2ff' }
  if ((b.totalPrice || 0) === 0) return { key: 'free', label: 'Free', color: '#2563eb', badge: 'badge-blue', bg: '#eff6ff' }
  if (b.paid) return { key: 'paid', label: 'Paid', color: '#059669', badge: 'badge-success', bg: '#ecfdf5' }
  return { key: 'unpaid', label: 'Unpaid', color: '#b45309', badge: 'badge-warning', bg: '#fffbeb' }
}

export const canFinish = (b: Booking) => !b.finished && (b.paid || (b.totalPrice || 0) === 0)
