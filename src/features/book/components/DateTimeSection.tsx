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
      <h2 className="mb-5">{t('pickDateTime')}</h2>

      <div className="form-group mb-5 max-w-[240px]">
        <label className="form-label">{t('date')}</label>
        <input
          type="date" className="form-input"
          value={date}
          min={nowUZ().toISOString().split('T')[0]}
          onChange={e => { setDate(e.target.value); setSelectedSlot('') }}
          required
        />
      </div>

      <label className="form-label mb-2 flex items-center gap-1.5">
        <Clock size={14} /> {t('availableSlots', { duration: formatDuration(activePlan.duration) })}
      </label>
      {closedOnDate ? (
        <p className="text-danger text-sm">{t('serviceClosedOnDate')}</p>
      ) : availableSlots.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('noSlotsForDuration')}</p>
      ) : (
        // Only start times where the whole booking fits without colliding with an
        // existing booking (buffer included) are shown. Each shows its full range.
        <div className="flex flex-wrap gap-2">
          {availableSlots.map(slot => {
            const selected = selectedSlot === slot
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className="px-3.5 py-[7px] rounded-lg text-[0.8125rem] cursor-pointer transition-all duration-150 tabular-nums"
                style={{
                  border: `1.5px solid ${selected ? selectedService.color : 'var(--gray-200)'}`,
                  background: selected ? selectedService.color : '#fff',
                  color: selected ? '#fff' : 'var(--gray-700)',
                  fontWeight: selected ? 600 : 500,
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
