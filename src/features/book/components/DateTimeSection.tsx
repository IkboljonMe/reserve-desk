'use client'

import { Clock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { nowUZ } from '@/lib/timezone'
import { formatDuration, slotEnd } from '../utils'
import type { BookingWizard } from '../useBookingWizard'

export function DateTimeSection({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { selectedService, activePlan, planReady, guestReady, date, setDate, selectedSlot, setSelectedSlot, availableSlots, closedOnDate } = w
  if (!selectedService || !activePlan || !planReady || !guestReady) return null

  return (
    <div>
      <h2 style={{ marginBottom: '1.25rem' }}>{t('pickDateTime')}</h2>

      <div className="form-group" style={{ marginBottom: '1.25rem', maxWidth: 240 }}>
        <label className="form-label">{t('date')}</label>
        <input
          type="date" className="form-input"
          value={date}
          min={nowUZ().toISOString().split('T')[0]}
          onChange={e => { setDate(e.target.value); setSelectedSlot('') }}
          required
        />
      </div>

      <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Clock size={14} /> {t('availableSlots', { duration: formatDuration(activePlan.duration) })}
      </label>
      {closedOnDate ? (
        <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{t('serviceClosedOnDate')}</p>
      ) : availableSlots.length === 0 ? (
        <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>{t('noSlotsForDuration')}</p>
      ) : (
        // Only start times where the whole booking fits without colliding with an
        // existing booking (buffer included) are shown. Each shows its full range.
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {availableSlots.map(slot => {
            const selected = selectedSlot === slot
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: `1.5px solid ${selected ? selectedService.color : 'var(--gray-200)'}`,
                  background: selected ? selectedService.color : '#fff',
                  color: selected ? '#fff' : 'var(--gray-700)',
                  fontSize: '0.8125rem', fontWeight: selected ? 600 : 500,
                  cursor: 'pointer', fontVariantNumeric: 'tabular-nums',
                }}
              >
                {slot} → {slotEnd(slot, activePlan.duration)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
