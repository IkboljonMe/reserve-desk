export interface Hotel {
  _id: string
  name: string
  shortName: string
  roomTypes?: string[]
}

export interface ClientGroup {
  _id: string
  name: string
  color: string
}

export interface PricingPlan {
  duration: number | string
  price: number | string
}

export interface PricingGroup {
  target: 'room' | 'client'
  category: string
  rows: PricingPlan[]
}

export interface Service {
  _id: string
  name: string
  icon: string
  description: string
  hotelId: string | { _id: string; name: string; shortName?: string }
  sharedHotelIds?: string[]
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
  color: string
  isActive: boolean
}
