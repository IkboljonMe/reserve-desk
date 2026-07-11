'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n'
import { DEMO_HOTELS, type DemoService } from '@/features/demo/data'
import {
  getDemoSession, clearDemoSession, getDemoBookings, addDemoBooking, removeDemoBooking,
  type DemoBooking, type DemoSession,
} from '@/features/demo/storage'

export default function DemoDashboardClient() {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const [session, setSession] = useState<DemoSession | null>(null)
  const [bookings, setBookings] = useState<DemoBooking[]>([])
  const [bookingFor, setBookingFor] = useState<DemoService | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('10:00')

  useEffect(() => {
    const s = getDemoSession()
    if (!s) {
      router.replace(`/${lang}/demo`)
      return
    }
    setSession(s)
    setBookings(getDemoBookings(s.hotelId))
  }, [router, lang])

  if (!session) return null
  const hotel = DEMO_HOTELS.find(h => h.id === session.hotelId)
  if (!hotel) return null

  function handleLogout() {
    clearDemoSession()
    router.push(`/${lang}/demo`)
  }

  function openBooking(service: DemoService) {
    setBookingFor(service)
    setCustomerName('')
  }

  function submitBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!bookingFor || !customerName.trim()) return
    const booking: DemoBooking = {
      id: `${Date.now()}`,
      hotelId: hotel!.id,
      serviceId: bookingFor.id,
      serviceName: bookingFor.name,
      customerName: customerName.trim(),
      date,
      time,
      price: bookingFor.price,
      createdAt: new Date().toISOString(),
    }
    addDemoBooking(booking)
    setBookings(getDemoBookings(hotel!.id))
    setBookingFor(null)
  }

  function handleRemove(id: string) {
    removeDemoBooking(id)
    setBookings(getDemoBookings(hotel!.id))
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-card)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)', background: '#14192a',
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800 }}>{hotel.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{t('demoBadge')} · {session.staffName}</div>
        </div>
        <button className="btn btn-sm" onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
          {t('signOut')}
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.75rem 2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>{t('services')}</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 16 }}>{t('demoServicesHint')}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: '2rem' }}>
          {hotel.services.map(svc => (
            <div key={svc.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{svc.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: 12 }}>
                {svc.price ? `${svc.price.toLocaleString()} UZS` : t('free')} · {svc.durationMinutes} {t('minutesShort')}
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => openBooking(svc)}>
                {t('bookNow')}
              </button>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 12 }}>{t('bookings')}</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <p>{t('noDemoBookings')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {bookings.map((b, i) => (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{b.serviceName} — {b.customerName}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{b.date} {b.time}</div>
                  </div>
                  <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)' }}>
                    {b.price ? `${b.price.toLocaleString()} UZS` : t('free')}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(b.id)}>{t('delete')}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {bookingFor && (
        <div className="modal-overlay" onClick={() => setBookingFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>{bookingFor.name}</h2>
            </div>
            <form onSubmit={submitBooking}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('customerName')} *</label>
                  <input className="form-input" required autoFocus value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">{t('date')}</label>
                    <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">{t('time')}</label>
                    <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingFor(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('bookNow')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
