// Types local to the booking wizard. Intentionally stricter than the shared
// `@/types` versions (e.g. openTime/closeTime are required here) so the wizard
// code can use them without extra null guards.

export interface PricingPlan { duration: number; price: number }
export interface PricingGroup { target: 'room' | 'client'; category: string; rows: PricingPlan[] }
export interface ServiceVariant { id: string; name: string; pricingPlans?: PricingPlan[]; pricingGroups?: PricingGroup[] }

export interface Service {
  _id: string
  name: string
  description: string
  location: string
  openTime: string
  closeTime: string
  slotDuration: number
  capacity: number
  price?: number
  isFree?: boolean
  details?: string
  bufferTimeBefore?: number
  bufferTimeAfter?: number
  pricingPlans?: PricingPlan[]
  pricingGroups?: PricingGroup[]
  variants?: ServiceVariant[]
  color: string
  isActive: boolean
  hotelId: string | { _id: string; name?: string; shortName?: string }
  sharedHotelIds?: string[]
}

export interface Room {
  _id: string
  hotelId: string
  number: string
  floor: number
  type?: string
}

export interface Hotel {
  _id: string
  shortName: string
  name?: string
}

export interface ClientGroup {
  _id: string
  name: string
  color: string
}

export interface Client {
  _id: string
  name: string
  phone: string
  roomNumber: string
  floor: number
}

export type BookingType = 'client' | 'room' | 'custom'

export interface DayBooking {
  startTime: string
  bufferedEndTime?: string
  endTime: string
  status: string
}
