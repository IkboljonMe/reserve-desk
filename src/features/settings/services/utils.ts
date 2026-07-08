import type { Service, PricingPlan, PricingGroup } from './types'

// Safely extract a plain-string hotel ID regardless of whether hotelId was
// populated (object) or left as a raw ObjectId string.
export function extractHotelId(hotelId: Service['hotelId']): string {
  if (!hotelId) return ''
  if (typeof hotelId === 'string') return hotelId
  return hotelId._id ?? ''
}

export const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b',
  '#10b981','#06b6d4','#3b82f6','#f97316','#84cc16',
  '#64748b','#a16207',
]

export const DRAFT_KEY = 'add-service'

export const EMPTY_FORM = {
  name: '', description: '', hotelId: '', sharedHotelIds: [] as string[], icon: 'Waves',
  openTime: '08:00', closeTime: '20:00',
  slotDuration: 60, capacity: 1, color: '#6366f1',
  price: 0, isFree: false, details: '',
  bufferTimeBefore: 0, bufferTimeAfter: 0,
  pricingPlans: [] as PricingPlan[],
  pricingGroups: [] as PricingGroup[],
}
export type ServiceForm = typeof EMPTY_FORM

const DURATION_STEP = 15

export function durationError(v: number | string): boolean {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  return !Number.isInteger(n) || n <= 0 || n % DURATION_STEP !== 0
}

export function bufferError(v: number | string): boolean {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  return !Number.isInteger(n) || n < 0 || n % DURATION_STEP !== 0
}

export function selectAllOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.select()
}

export function formatPrice(v: number | string): string {
  const digits = String(v ?? '').replace(/\D/g, '')
  if (digits === '') return ''
  return String(Number(digits)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
