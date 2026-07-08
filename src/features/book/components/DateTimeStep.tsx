'use client'

import { Clock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { nowUZ } from '@/lib/timezone'
import { formatDuration, toMin } from '../utils'
import { BackButton } from './BackButton'
import { ContextBar } from './ContextBar'
import type { BookingWizard } from '../useBookingWizard'

export function DateTimeStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { selectedService, activePlan, date, setDate, selectedSlot, setSelectedSlot, timeSlots, dayBookings, setStep } = w
  if (!selectedService || !activePlan) return null

  return (
    <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <BackButton to={3} onBack={setStep} />
        <h2 style={{ margin: 0 }}>{t('pickDateTime')}</h2>
      </div>
      <ContextBar w={w} />

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
      {timeSlots.length === 0 ? (
        <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>{t('noSlotsForDuration')}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {timeSlots.map(slot => {
            // Mirror the server's buffered-overlap rule: the candidate booking
            // reserves [start - bufferBefore, end + bufferAfter], and must not
            // overlap any existing booking's raw [start, end] for this service.
            const before = selectedService.bufferTimeBefore || 0
            const after = selectedService.bufferTimeAfter || 0
            const start = toMin(slot)
            const end = start + activePlan.duration
            const bufferedStart = start - before
            const bufferedEnd = end + after
            const booked = dayBookings.some(b =>
              toMin(b.startTime) < bufferedEnd && toMin(b.endTime) > bufferedStart
            )
            const selected = selectedSlot === slot
            return (
              <button
                key={slot}
                type="button"
                disabled={booked}
                onClick={() => setSelectedSlot(slot)}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: `1.5px solid ${selected ? selectedService.color : 'var(--gray-200)'}`,
                  background: selected ? selectedService.color : booked ? 'var(--gray-100)' : '#fff',
                  color: selected ? '#fff' : booked ? 'var(--gray-300)' : 'var(--gray-700)',
                  fontSize: '0.8125rem', fontWeight: selected ? 600 : 400,
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

      {selectedSlot && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={() => setStep(5)}>Continue →</button>
        </div>
      )}
    </div>
  )
}
