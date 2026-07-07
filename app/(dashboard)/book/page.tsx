'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { nowUZ } from '@/lib/timezone'

interface PricingPlan { duration: number; price: number }

interface Service {
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
  bufferTime?: number
  pricingPlans?: PricingPlan[]
  color: string
  isActive: boolean
  hotelId: any
}

interface Room {
  _id: string
  hotelId: string
  number: string
  floor: number
}

interface Hotel {
  _id: string
  shortName: string
}

interface Client {
  _id: string
  name: string
  phone: string
  roomNumber: string
  floor: number
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: '✓ Confirmed' },
  { value: 'pending', label: '⏳ Pending' },
]

function generateTimeSlots(openTime: string, closeTime: string, activeDuration: number): string[] {
  if (!activeDuration) return []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  
  let start = openH * 60 + openM
  // Round UP to the next 15-minute interval if it doesn't land perfectly on one
  if (start % 15 !== 0) {
    start = start + (15 - (start % 15))
  }

  const end = closeH * 60 + closeM
  const slots: string[] = []
  
  // Step by 15-minute intervals, ensuring the required duration fits before closing time
  for (let t = start; t + activeDuration <= end; t += 15) {
    const h = Math.floor(t / 60).toString().padStart(2, '0')
    const m = (t % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
  }
  return slots
}

function slotEnd(startTime: string, duration: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + duration
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

function extractHotelId(hotelId: any): string {
  if (!hotelId) return ''
  return typeof hotelId === 'string' ? hotelId : (hotelId._id || '')
}

export default function BookPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [date, setDate] = useState(searchParams.get('date') || nowUZ().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(searchParams.get('time') || '')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'confirmed' | 'pending'>('confirmed')
  const [loading, setLoading] = useState(false)
  const [dayBookings, setDayBookings] = useState<Array<{ startTime: string; bufferedEndTime?: string; endTime: string; status: string }>>([])
  const [step, setStep] = useState(1)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<Client[]>([])
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const clientSearchRef = useRef<HTMLDivElement>(null)

  const preServiceId = searchParams.get('serviceId')

  useEffect(() => {
    Promise.all([
      fetch('/api/services').then(r => r.json()),
      fetch('/api/rooms').then(r => r.json()),
      fetch('/api/hotels').then(r => r.json()),
    ]).then(([svcs, rms, htls]) => {
      const active = Array.isArray(svcs) ? svcs.filter((s: Service) => s.isActive) : []
      setServices(active)
      setRooms(Array.isArray(rms) ? rms : [])
      setHotels(Array.isArray(htls) ? htls : [])
      if (preServiceId) {
        const found = active.find((s: Service) => s._id === preServiceId)
        if (found) {
          const hid = extractHotelId(found.hotelId)
          if (hid) setSelectedHotelId(hid)
          setSelectedService(found)
          if (!found.pricingPlans || found.pricingPlans.length === 0) {
            setSelectedPlan({ duration: found.slotDuration, price: found.isFree ? 0 : (found.price || 0) })
          }
          setStep(3)
        }
      }
    })
  }, [preServiceId])

  // Search clients
  useEffect(() => {
    if (!clientSearch.trim()) {
      setClientResults([])
      return
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
      const data = await res.json()
      setClientResults(Array.isArray(data) ? data.slice(0, 6) : [])
    }, 250)
    return () => clearTimeout(timer)
  }, [clientSearch])

  // Close client dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setClientSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    if (!selectedService || !date) return
    fetch(`/api/bookings?dateFrom=${date}&dateTo=${date}&serviceId=${selectedService._id}`)
      .then(r => r.json())
      .then(data => setDayBookings(Array.isArray(data) ? data.filter((b: { status: string }) => b.status !== 'cancelled') : []))
  }, [selectedService, date])

  function handleSelectClient(c: Client) {
    setSelectedClientId(c._id)
    setCustomerName(c.name)
    setCustomerPhone(c.phone)
    setRoomNumber(c.roomNumber || '')
    setClientSearch(`${c.name}${c.roomNumber ? ` · Room ${c.roomNumber}` : ''}`)
    setClientSearchOpen(false)
    setClientResults([])
  }

  function clearClient() {
    setSelectedClientId(null)
    setClientSearch('')
    setCustomerName('')
    setCustomerPhone('')
    setRoomNumber('')
    setClientResults([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService || !selectedSlot || !customerName || !date || !selectedPlan) return

    setLoading(true)
    try {
      const endTime = slotEnd(selectedSlot, selectedPlan.duration)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService._id,
          clientId: selectedClientId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          roomNumber: roomNumber.trim(),
          date,
          startTime: selectedSlot,
          endTime,
          duration: selectedPlan.duration,
          totalPrice: selectedPlan.price,
          notes: notes.trim(),
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to create booking', 'error')
      } else {
        showToast('Booking created successfully!', 'success')
        router.push(`/calendar?date=${date}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectService = (svc: Service) => {
    setSelectedService(svc)
    setSelectedSlot('')
    if (svc.pricingPlans && svc.pricingPlans.length > 0) {
      setSelectedPlan(null)
    } else {
      setSelectedPlan({ duration: svc.slotDuration || 60, price: svc.isFree ? 0 : (svc.price || 0) })
    }
    setStep(3)
  }

  const timeSlots = selectedService && selectedPlan
    ? generateTimeSlots(selectedService.openTime, selectedService.closeTime, selectedPlan.duration)
    : []

  // Group rooms by floor
  const floorGroups = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b)

  // Room display name uses the hotel's compact code, e.g. "FG-202".
  const roomLabel = (r: Room) => `${hotels.find(h => h._id === r.hotelId)?.shortName || '??'}-${r.number}`

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>{t('newBooking')}</h1>
          <p style={{ marginTop: 4 }}>Reserve a service for a guest</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem' }}>
        {[
          { n: 1, label: 'Select Hotel' },
          { n: 2, label: 'Select Service' },
          { n: 3, label: 'Date & Time' },
          { n: 4, label: 'Guest Info' },
        ].map(({ n, label }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step >= n ? 'var(--brand-500)' : 'var(--gray-200)',
              color: step >= n ? '#fff' : 'var(--gray-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8125rem',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}>{n}</div>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: step === n ? 600 : 400,
              color: step === n ? 'var(--gray-800)' : 'var(--gray-400)',
            }}>{label}</span>
            {n < 4 && <div style={{ flex: 1, height: 2, background: step > n ? 'var(--brand-500)' : 'var(--gray-200)', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Hotel */}
        {step === 1 && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <h2 style={{ marginBottom: '1rem' }}>Choose a Hotel</h2>
            {hotels.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M3 7v14M21 7v14M6 21V7c0-2 2-3 4-3h4c2 0 4 1 4 3v14"/>
                  </svg>
                </div>
                <h3>No hotels found</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {hotels.map(hotel => (
                  <button
                    key={hotel._id}
                    type="button"
                    onClick={() => { setSelectedHotelId(hotel._id); setStep(2) }}
                    style={{
                      border: `2px solid ${selectedHotelId === hotel._id ? 'var(--brand-500)' : 'var(--gray-200)'}`,
                      borderRadius: 12,
                      padding: '1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: selectedHotelId === hotel._id ? 'var(--brand-50)' : '#fff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{hotel.shortName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Service */}
        {step === 2 && selectedHotelId && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
              <h2 style={{ margin: 0 }}>Choose a Service</h2>
            </div>
            {services.filter(s => extractHotelId(s.hotelId) === selectedHotelId).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h3>No active services for this hotel</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {services.filter(s => extractHotelId(s.hotelId) === selectedHotelId).map(svc => (
                  <button
                    key={svc._id}
                    type="button"
                    onClick={() => handleSelectService(svc)}
                    style={{
                      border: `2px solid ${selectedService?._id === svc._id ? svc.color : 'var(--gray-200)'}`,
                      borderRadius: 12,
                      padding: '1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: selectedService?._id === svc._id ? `${svc.color}15` : '#fff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, marginBottom: 10,
                      background: `${svc.color}18`,
                      color: svc.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {getServiceIcon(svc.name)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', marginBottom: 2 }}>{svc.name}</div>
                    {svc.isFree ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{t('isFree')}</span>
                    ) : svc.pricingPlans && svc.pricingPlans.length > 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--brand-600)', fontWeight: 600 }}>{svc.pricingPlans.length} {t('pricingPlans')}</span>
                    ) : svc.price && svc.price > 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--brand-600)', fontWeight: 600 }}>UZS {svc.price.toLocaleString()}</span>
                    ) : null}
                    {svc.location && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>📍 {svc.location}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & time */}
        {step === 3 && selectedService && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>← Back</button>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${selectedService.color}18`,
                color: selectedService.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {getServiceIcon(selectedService.name)}
              </div>
              <h2>{selectedService.name}</h2>
            </div>

            {/* Pricing Plans */}
            {selectedService.pricingPlans && selectedService.pricingPlans.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Choose Duration / Price
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedService.pricingPlans.map((plan, i) => {
                    const isSelected = selectedPlan?.duration === plan.duration && selectedPlan?.price === plan.price
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSelectedPlan(plan); setSelectedSlot('') }}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: `2px solid ${isSelected ? selectedService.color : 'var(--gray-200)'}`,
                          background: isSelected ? `${selectedService.color}15` : '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>
                          {plan.duration >= 60 ? `${plan.duration / 60}h` : `${plan.duration}m`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-600)' }}>
                          {plan.price > 0 ? `UZS ${plan.price.toLocaleString()}` : t('isFree')}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedPlan && (
              <>
                <div className="form-group" style={{ marginBottom: '1.25rem', maxWidth: 240 }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    min={nowUZ().toISOString().split('T')[0]}
                    onChange={e => { setDate(e.target.value); setSelectedSlot('') }}
                    required
                  />
                </div>

                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Available Time Slots ({selectedPlan.duration}m)
                </label>
                {timeSlots.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No slots available.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {timeSlots.map(slot => {
                      const slotEndTime = slotEnd(slot, selectedPlan.duration)
                      const buffer = selectedService.bufferTime || 0
                      const [h, m] = slotEndTime.split(':').map(Number)
                      const totalM = h * 60 + m + buffer
                      const slotBufferedEndTime = `${Math.floor(totalM / 60).toString().padStart(2, '0')}:${(totalM % 60).toString().padStart(2, '0')}`
                      const booked = dayBookings.some(b => {
                        const existingBufferedEnd = b.bufferedEndTime || b.endTime
                        return b.startTime < slotBufferedEndTime && existingBufferedEnd > slot
                      })
                      const selected = selectedSlot === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={booked}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: `1.5px solid ${selected ? selectedService.color : 'var(--gray-200)'}`,
                            background: selected ? selectedService.color : booked ? 'var(--gray-100)' : '#fff',
                            color: selected ? '#fff' : booked ? 'var(--gray-300)' : 'var(--gray-700)',
                            fontSize: '0.8125rem',
                            fontWeight: selected ? 600 : 400,
                            cursor: booked ? 'not-allowed' : 'pointer',
                            textDecoration: booked ? 'line-through' : 'none',
                          }}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {selectedSlot && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Guest Info */}
        {step === 4 && selectedService && selectedSlot && selectedPlan && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>← Back</button>
              <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                {selectedService.name} · {date} · {selectedSlot} – {slotEnd(selectedSlot, selectedPlan.duration)}
              </span>
            </div>

            {/* Client Search */}
            <div className="form-group" style={{ marginBottom: '1.25rem', position: 'relative' }} ref={clientSearchRef}>
              <label className="form-label">Search Saved Guest</label>
              <div style={{ position: 'relative' }}>
                <svg
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                >
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="form-input"
                  style={{ paddingLeft: 34, paddingRight: selectedClientId ? 34 : 12 }}
                  placeholder="Type name or room number…"
                  value={clientSearch}
                  onChange={e => {
                    setClientSearch(e.target.value)
                    setClientSearchOpen(true)
                    if (!e.target.value) clearClient()
                  }}
                  onFocus={() => clientSearch && setClientSearchOpen(true)}
                />
                {selectedClientId && (
                  <button
                    type="button"
                    onClick={clearClient}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--gray-400)', padding: 2,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {clientSearchOpen && clientResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden',
                }}>
                  {clientResults.map(c => (
                    <div
                      key={c._id}
                      onClick={() => handleSelectClient(c)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        borderBottom: '1px solid var(--gray-100)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'var(--brand-100)', color: 'var(--brand-600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                      }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.875rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          {c.roomNumber ? `🏨 Room ${c.roomNumber}` : ''}{c.phone ? ` · ${c.phone}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('guestInfo')} *</label>
                <input
                  id="customerName"
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  id="customerPhone"
                  type="tel"
                  className="form-input"
                  placeholder="+1 234 567 8900"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Room Number */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Room Number</label>
              {rooms.length > 0 ? (
                <select
                  className="form-select"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                >
                  <option value="">No room / Walk-in</option>
                  {floorGroups.map(floor => (
                    <optgroup key={floor} label={`Floor ${floor}`}>
                      {rooms.filter(r => r.floor === floor).map(r => (
                        <option key={r._id} value={roomLabel(r)}>🏨 {roomLabel(r)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <input
                  className="form-input"
                  placeholder="e.g. 101"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                />
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Notes (optional)</label>
              <textarea
                id="bookingNotes"
                className="form-textarea"
                placeholder="Any special requirements…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{t('status')}</label>
              <select
                id="bookingStatus"
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value as 'confirmed' | 'pending')}
                style={{ maxWidth: 200 }}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div style={{
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
              borderRadius: 10, padding: '1rem', marginBottom: '1.25rem',
              fontSize: '0.875rem', display: 'grid', gridTemplateColumns: 'auto 1fr',
              gap: '0.4rem 1rem', color: 'var(--gray-600)',
            }}>
              <strong style={{ color: 'var(--gray-800)' }}>Service</strong>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: selectedService.color }}>{getServiceIcon(selectedService.name)}</span>
                {selectedService.name}
              </span>
              <strong style={{ color: 'var(--gray-800)' }}>Date</strong> <span>{date}</span>
              <strong style={{ color: 'var(--gray-800)' }}>Time</strong> <span>{selectedSlot} – {slotEnd(selectedSlot, selectedPlan.duration)} ({selectedPlan.duration}m)</span>
              <strong style={{ color: 'var(--gray-800)' }}>Total Price</strong>
              <span style={{ color: 'var(--brand-700)', fontWeight: 600 }}>
                {selectedPlan.price === 0 ? t('isFree') : `UZS ${selectedPlan.price.toLocaleString()}`}
              </span>
              <strong style={{ color: 'var(--gray-800)' }}>Guest</strong> <span>{customerName || '—'}</span>
              {roomNumber && <><strong style={{ color: 'var(--gray-800)' }}>Room</strong> <span>🏨 {roomNumber}</span></>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/calendar')}>
                {t('cancel')}
              </button>
              <button
                id="confirm-booking-btn"
                type="submit"
                className="btn btn-primary"
                disabled={loading || !customerName}
              >
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Creating…' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
