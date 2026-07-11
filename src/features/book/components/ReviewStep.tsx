'use client'

import { BedDouble } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { chipStyle } from '../styles'
import { formatDuration, formatUZS, slotEnd } from '../utils'
import type { BookingWizard } from '../useBookingWizard'

// Slide: a read-only summary of everything picked in the previous slides,
// plus headcount and payment status. Back/Confirm live in the modal's shared
// footer, not here.
export function ReviewStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const {
    hotels, selectedHotelId, selectedService, selectedVariant, bookingType, categoryMeta,
    activePlan, selectedSlot, date, customerName, customerPhone, roomNumber, notes,
    menu, menuReadyTime,
    persons, setPersons, paid, setPaid, amountPaid, setAmountPaid,
  } = w
  if (!selectedService || !activePlan || !selectedSlot) return null

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>{t('confirmBooking')}</h2>
      <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: 0, marginBottom: '1.25rem' }}>{t('reviewYourBooking')}</p>

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

        {menu && (
          <>
            <strong style={{ color: 'var(--gray-800)' }}>{t('menu')}</strong>
            <span>{menu}{menuReadyTime && ` · ${t('menuReadyTime')} ${menuReadyTime}`}</span>
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

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">{t('payment')}</label>
        {activePlan.price === 0 ? (
          <div style={{ ...chipStyle('#3b82f618', '#2563eb'), padding: '8px 12px' }}>{t('freeNoPayment')}</div>
        ) : (
          <>
            <select
              className="form-select" style={{ maxWidth: 200 }}
              value={paid ? 'paid' : amountPaid > 0 ? 'deposit' : 'unpaid'}
              onChange={e => {
                const v = e.target.value
                if (v === 'paid') { setPaid(true); setAmountPaid(activePlan.price) }
                else if (v === 'deposit') { setPaid(false); setAmountPaid(Math.round(activePlan.price / 2)) }
                else { setPaid(false); setAmountPaid(0) }
              }}
            >
              <option value="unpaid">{t('unpaid')}</option>
              <option value="deposit">{t('deposit')}</option>
              <option value="paid">{t('paid')}</option>
            </select>
            {!paid && amountPaid > 0 && (
              <div style={{ marginTop: 10, maxWidth: 200 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('depositAmount')}</label>
                <input
                  type="text" inputMode="numeric" className="form-input"
                  value={formatUZS(amountPaid)}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '')
                    setAmountPaid(Math.min(activePlan.price, Number(digits) || 0))
                  }}
                  onFocus={e => e.currentTarget.select()}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: '6px 0 0' }}>
                  {t('balanceDueAfter', { amount: `${formatUZS(Math.max(0, activePlan.price - amountPaid))} ${t('sum')}` })}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
