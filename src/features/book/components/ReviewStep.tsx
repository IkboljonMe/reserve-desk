'use client'

import { BedDouble } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { chipStyle } from '../styles'
import { formatDuration, formatUZS, slotEnd } from '../utils'
import { BackButton } from './BackButton'
import type { BookingWizard } from '../useBookingWizard'

// Step 2: nothing but a read-only summary of everything picked in step 1,
// plus the payment status and the final "Confirm Booking" action.
export function ReviewStep({ w }: { w: BookingWizard }) {
  const { t, lang } = useTranslation()
  const {
    hotels, selectedHotelId, selectedService, selectedVariant, bookingType, categoryMeta,
    activePlan, selectedSlot, date, customerName, customerPhone, roomNumber, notes,
    persons, setPersons, paid, setPaid, loading, router, confirmBooking, setStep,
  } = w
  if (!selectedService || !activePlan || !selectedSlot) return null

  return (
    <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <BackButton to={1} onBack={setStep} />
        <h2 style={{ margin: 0 }}>{t('confirmBooking')}</h2>
      </div>
      <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: -8, marginBottom: '1.25rem' }}>{t('reviewYourBooking')}</p>

      {/* Order summary */}
      <div style={{
        background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 10,
        padding: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem',
        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.6rem 1rem', color: 'var(--gray-600)',
      }}>
        <strong style={{ color: 'var(--gray-800)' }}>{t('hotel')}</strong>
        <span>{hotels.find(h => h._id === selectedHotelId)?.shortName || '—'}</span>

        <strong style={{ color: 'var(--gray-800)' }}>{t('service')}</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: selectedService.color, display: 'inline-flex' }}>{getServiceIcon(selectedService.name)}</span>
          {selectedService.name}
          {selectedVariant && <span style={chipStyle(`${selectedService.color}12`, selectedService.color)}>{selectedVariant.name}</span>}
        </span>

        <strong style={{ color: 'var(--gray-800)' }}>{t('toWhom')}</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {customerName || <span style={{ color: 'var(--gray-300)' }}>{t('guest')}</span>}
          {customerPhone && <span style={{ color: 'var(--gray-400)' }}>· {customerPhone}</span>}
          {categoryMeta && (
            <span style={chipStyle(`${categoryMeta.color}18`, categoryMeta.color)}>{categoryMeta.label}</span>
          )}
          {bookingType === 'room' && roomNumber && (
            <span style={chipStyle('var(--gray-100)', 'var(--gray-600)')}><BedDouble size={12} /> {roomNumber}</span>
          )}
        </span>

        {bookingType !== 'room' && roomNumber && (
          <>
            <strong style={{ color: 'var(--gray-800)' }}>{t('roomNumberField')}</strong>
            <span>{roomNumber}</span>
          </>
        )}

        <strong style={{ color: 'var(--gray-800)' }}>{t('whenLabel')}</strong>
        <span>{date} · {selectedSlot} – {slotEnd(selectedSlot, activePlan.duration)} ({formatDuration(activePlan.duration)})</span>

        <strong style={{ color: 'var(--gray-800)' }}>{t('howMuch')}</strong>
        <span style={{ color: 'var(--brand-700)', fontWeight: 700 }}>
          {activePlan.price === 0 ? t('isFree') : `${formatUZS(activePlan.price)} ${t('sum')}`}
        </span>

        {notes && (
          <>
            <strong style={{ color: 'var(--gray-800)' }}>{t('notesOptional')}</strong>
            <span>{notes}</span>
          </>
        )}
      </div>

      <div className="form-group" style={{ marginBottom: '1.25rem', maxWidth: 200 }}>
        <label className="form-label">{t('personsCount')}</label>
        <input
          type="number" className="form-input" min={1} step={1}
          value={persons}
          onChange={e => setPersons(Math.max(1, parseInt(e.target.value) || 1))}
          onFocus={e => e.currentTarget.select()}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">{t('payment')}</label>
        {activePlan.price === 0 ? (
          <div style={{ ...chipStyle('#3b82f618', '#2563eb'), padding: '8px 12px' }}>{t('freeNoPayment')}</div>
        ) : (
          <select
            className="form-select" style={{ maxWidth: 200 }}
            value={paid ? 'paid' : 'unpaid'}
            onChange={e => setPaid(e.target.value === 'paid')}
          >
            <option value="unpaid">{t('unpaid')}</option>
            <option value="paid">{t('paid')}</option>
          </select>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="btn btn-secondary" onClick={() => router.push(`/${lang}/calendar`)}>{t('cancel')}</button>
        <button
          id="confirm-booking-btn"
          type="button"
          className="btn btn-primary"
          disabled={loading}
          onClick={confirmBooking}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? t('creating') : t('confirmBooking')}
        </button>
      </div>
    </div>
  )
}
