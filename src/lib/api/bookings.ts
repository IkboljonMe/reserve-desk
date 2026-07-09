export interface BookingInput {
  serviceId: string
  clientId?: string | null
  customerName: string
  customerPhone: string
  roomNumber: string
  date: string
  startTime: string
  endTime: string
  duration: number
  totalPrice: number
  notes: string
  paid: boolean
  bookingType?: 'client' | 'room' | 'custom' | null
  category?: string
  variantId?: string
}

export async function getBookings(dateFrom: string, dateTo: string) {
  const res = await fetch(`/api/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`)
  if (!res.ok) throw new Error('Failed to fetch bookings')
  return res.json()
}

export async function getBookingById(id: string) {
  const res = await fetch(`/api/bookings/${id}`)
  if (!res.ok) throw new Error('Failed to fetch booking details')
  return res.json()
}

export async function createBooking(data: BookingInput) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.error || 'Failed to create booking')
  }
  return res.json()
}

export async function updateBooking(id: string, data: Partial<BookingInput> & { finished?: boolean }) {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.error || 'Failed to update booking')
  }
  return res.json()
}

export async function deleteBooking(id: string) {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete booking')
  return res.json()
}
