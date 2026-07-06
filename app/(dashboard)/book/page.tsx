'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useRouter, useSearchParams } from 'next/navigation'

interface Service {
  _id: string
  name: string
  description: string
  location: string
  openTime: string
  closeTime: string
  slotDuration: number
  capacity: number
  color: string
  isActive: boolean
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: '✓ Confirmed' },
  { value: 'pending', label: '⏳ Pending' },
]

const SERVICE_COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#3b82f6','#f97316','#84cc16']

function generateTimeSlots(openTime: string, closeTime: string, slotDuration: number): string[] {
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  const start = openH * 60 + openM
  const end = closeH * 60 + closeM
  const slots: string[] = []
  for (let t = start; t + slotDuration <= end; t += slotDuration) {
    const h = Math.floor(t / 60).toString().padStart(2, '0')
    const m = (t % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
  }
  return slots
}

function slotEnd(startTime: string, slotDuration: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + slotDuration
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export default function BookPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(searchParams.get('time') || '')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'confirmed' | 'pending'>('confirmed')
  const [loading, setLoading] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [step, setStep] = useState(1)

  // Pre-select service from query
  const preServiceId = searchParams.get('serviceId')

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then((data: Service[]) => {
        const active = data.filter(s => s.isActive)
        setServices(active)
        if (preServiceId) {
          const found = active.find(s => s._id === preServiceId)
          if (found) { setSelectedService(found); setStep(2) }
        }
      })
  }, [preServiceId])

  // Load booked slots when service+date change
  useEffect(() => {
    if (!selectedService || !date) return
    fetch(`/api/bookings?dateFrom=${date}&dateTo=${date}&serviceId=${selectedService._id}`)
      .then(r => r.json())
      .then((bookings: Array<{ startTime: string; status: string }>) => {
        setBookedSlots(bookings.filter(b => b.status !== 'cancelled').map(b => b.startTime))
      })
  }, [selectedService, date])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService || !selectedSlot || !customerName || !date) return

    setLoading(true)
    try {
      const endTime = slotEnd(selectedSlot, selectedService.slotDuration)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService._id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          date,
          startTime: selectedSlot,
          endTime,
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

  const timeSlots = selectedService
    ? generateTimeSlots(selectedService.openTime, selectedService.closeTime, selectedService.slotDuration)
    : []

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>New Booking</h1>
          <p style={{ marginTop: 4 }}>Reserve a service for a customer</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem' }}>
        {[
          { n: 1, label: 'Select Service' },
          { n: 2, label: 'Date & Time' },
          { n: 3, label: 'Customer Info' },
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
            {n < 3 && <div style={{ flex: 1, height: 2, background: step > n ? 'var(--brand-500)' : 'var(--gray-200)', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Service */}
        {step === 1 && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <h2 style={{ marginBottom: '1rem' }}>Choose a Service</h2>
            {services.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <h3>No active services</h3>
                <p>Create services in Settings first</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {services.map(svc => (
                  <button
                    key={svc._id}
                    type="button"
                    onClick={() => { setSelectedService(svc); setSelectedSlot(''); setStep(2) }}
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
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: svc.color, marginBottom: 8,
                    }} />
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', marginBottom: 2 }}>{svc.name}</div>
                    {svc.location && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>📍 {svc.location}</div>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 4 }}>
                      {svc.openTime} – {svc.closeTime} · {svc.slotDuration}min slots
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & time */}
        {step === 2 && selectedService && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedService.color }} />
              <h2>{selectedService.name}</h2>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem', maxWidth: 240 }}>
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => { setDate(e.target.value); setSelectedSlot('') }}
                required
              />
            </div>

            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Available Time Slots</label>
            {timeSlots.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No slots available for this configuration.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {timeSlots.map(slot => {
                  const booked = bookedSlots.includes(slot)
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
                        border: `1.5px solid ${selected ? selectedService.color : booked ? 'var(--gray-200)' : 'var(--gray-200)'}`,
                        background: selected ? selectedService.color : booked ? 'var(--gray-100)' : '#fff',
                        color: selected ? '#fff' : booked ? 'var(--gray-300)' : 'var(--gray-700)',
                        fontSize: '0.8125rem',
                        fontWeight: selected ? 600 : 400,
                        cursor: booked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.12s',
                        textDecoration: booked ? 'line-through' : 'none',
                      }}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}

            {selectedSlot && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
                  Continue →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer info */}
        {step === 3 && selectedService && selectedSlot && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>← Back</button>
              <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                {selectedService.name} · {date} · {selectedSlot} – {slotEnd(selectedSlot, selectedService.slotDuration)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
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
                <label className="form-label">Phone (optional)</label>
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
              <label className="form-label">Status</label>
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
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.4rem 1rem',
              color: 'var(--gray-600)',
            }}>
              <strong style={{ color: 'var(--gray-800)' }}>Service</strong> <span>{selectedService.name}</span>
              <strong style={{ color: 'var(--gray-800)' }}>Date</strong> <span>{date}</span>
              <strong style={{ color: 'var(--gray-800)' }}>Time</strong> <span>{selectedSlot} – {slotEnd(selectedSlot, selectedService.slotDuration)}</span>
              <strong style={{ color: 'var(--gray-800)' }}>Guest</strong> <span>{customerName || '—'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/calendar')}>
                Cancel
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
