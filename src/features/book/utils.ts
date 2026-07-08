import { Service } from './types'

// A service is available to a hotel if that hotel owns it or it's shared with it.
export function serviceAvailableToHotel(s: Service, hotelId: string): boolean {
  if (extractHotelId(s.hotelId) === hotelId) return true
  return (s.sharedHotelIds ?? []).map(h => (typeof h === 'string' ? h : (h as { _id: string })._id)).includes(hotelId)
}

export function extractHotelId(hotelId: Service['hotelId']): string {
  if (!hotelId) return ''
  return typeof hotelId === 'string' ? hotelId : (hotelId._id || '')
}

export function generateTimeSlots(openTime: string, closeTime: string, activeDuration: number): string[] {
  if (!activeDuration) return []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  let start = openH * 60 + openM
  if (start % 15 !== 0) start = start + (15 - (start % 15))

  const end = closeH * 60 + closeM
  const slots: string[] = []
  for (let t = start; t + activeDuration <= end; t += 15) {
    const h = Math.floor(t / 60).toString().padStart(2, '0')
    const m = (t % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
  }
  return slots
}

export function slotEnd(startTime: string, duration: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + duration
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function formatDuration(min: number): string {
  if (min >= 60 && min % 60 === 0) return `${min / 60}h`
  if (min > 60) return `${Math.floor(min / 60)}h ${min % 60}m`
  return `${min}m`
}

export function formatUZS(v: number): string {
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
