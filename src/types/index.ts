export type HotelRef = {
  _id: string
  name?: string
  shortName?: string
}

export interface Hotel {
  _id: string
  name: string
  shortName: string
}

export interface PricingPlan {
  duration: number
  price: number
}

export interface PricingGroup {
  target: 'room' | 'client'
  category: string
  rows: PricingPlan[]
}

export interface Service {
  _id: string
  name: string
  description?: string
  location?: string
  openTime?: string
  closeTime?: string
  slotDuration?: number
  capacity?: number
  price?: number
  isFree?: boolean
  details?: string
  bufferTimeBefore?: number
  bufferTimeAfter?: number
  pricingPlans?: PricingPlan[]
  pricingGroups?: PricingGroup[]
  color: string
  isActive: boolean
  hotelId?: string | HotelRef
}

export interface Actor {
  _id?: string
  name?: string
  email?: string
}

export interface BookingEvent {
  action: string
  at: string
  by?: Actor | string
  detail?: string
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
  createdBy?: Actor | string
  history?: BookingEvent[]
  paidAt?: string | null
  finishedAt?: string | null
  masked?: boolean  // set by the API when another hotel's booking on a shared service is redacted
}

export type ContractStatus = 'awaiting' | 'signed' | 'terminated'

export interface Contract {
  _id: string
  hotelId?: string
  organizationName: string
  inn: string
  representativeName: string
  phone: string
  contractNumber: string
  signDate: string | null
  finishDate: string | null
  status: ContractStatus
  contractLink: string
  notes: string
  reminderDays: number[]
  dismissedReminders: number[]
}

export type NotificationTier = 'expired' | 'urgent' | 'warning'

export interface ContractNotification {
  contractId: string
  organizationName: string
  contractNumber: string
  finishDate: string | null
  daysLeft: number
  tier: NotificationTier
  threshold: number
  title: string
  message: string
}
