'use client'

import { Plus, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { DictionaryKeys } from '@/i18n'
import type { DaySchedule } from '../types'

export interface ScheduleEditorProps {
  weeklyHours: DaySchedule[]
  blackoutDates: string[]
  defaultOpen: string
  defaultClose: string
  onChange: (next: { weeklyHours?: DaySchedule[]; blackoutDates?: string[] }) => void
}

// Weekdays shown Monday-first; `day` is the JS index (0 = Sunday … 6 = Saturday).
const WEEK_ORDER: { day: number; labelKey: DictionaryKeys }[] = [
  { day: 1, labelKey: 'dowMon' },
  { day: 2, labelKey: 'dowTue' },
  { day: 3, labelKey: 'dowWed' },
  { day: 4, labelKey: 'dowThu' },
  { day: 5, labelKey: 'dowFri' },
  { day: 6, labelKey: 'dowSat' },
  { day: 0, labelKey: 'dowSun' },
]

// Edits a service's per-weekday hours and blackout dates. Weekly hours are all-or
// -nothing: enabling seeds all 7 days from the base open/close, disabling clears
// them (so the flat hours apply everywhere).
export function ScheduleEditor({ weeklyHours, blackoutDates, defaultOpen, defaultClose, onChange }: ScheduleEditorProps) {
  const { t } = useTranslation()
  const custom = weeklyHours.length > 0
  const byDay = (d: number) => weeklyHours.find(h => h.day === d)

  function toggleCustom(on: boolean) {
    if (on) {
      onChange({ weeklyHours: WEEK_ORDER.map(({ day }) => ({ day, open: defaultOpen, close: defaultClose, closed: false })) })
    } else {
      onChange({ weeklyHours: [] })
    }
  }

  function updateDay(day: number, patch: Partial<DaySchedule>) {
    onChange({ weeklyHours: weeklyHours.map(h => h.day === day ? { ...h, ...patch } : h) })
  }

  function addBlackout(date: string) {
    if (!date || blackoutDates.includes(date)) return
    onChange({ blackoutDates: [...blackoutDates, date].sort() })
  }

  function removeBlackout(date: string) {
    onChange({ blackoutDates: blackoutDates.filter(d => d !== date) })
  }

  return (
    <div style={{ border: '1px solid var(--brand-100)', borderRadius: 10, padding: 16, background: '#fcfdff' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--brand-700)', margin: 0 }}>{t('weeklySchedule')}</h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', margin: '2px 0 0' }}>{t('weeklyScheduleHint')}</p>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer', marginBottom: custom ? 12 : 0 }}>
        <input type="checkbox" checked={custom} onChange={e => toggleCustom(e.target.checked)} />
        {t('useCustomHours')}
      </label>

      {!custom && (
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', margin: 0 }}>{t('defaultHoursApply')}</p>
      )}

      {custom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {WEEK_ORDER.map(({ day, labelKey }) => {
            const row = byDay(day)
            if (!row) return null
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 42, fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>{t(labelKey)}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--gray-500)', width: 88 }}>
                  <input type="checkbox" checked={!row.closed} onChange={e => updateDay(day, { closed: !e.target.checked })} />
                  {row.closed ? t('dayClosed') : t('dayOpen')}
                </label>
                <input
                  type="time" className="form-input" style={{ width: 120, opacity: row.closed ? 0.5 : 1 }}
                  value={row.open} disabled={row.closed}
                  onChange={e => updateDay(day, { open: e.target.value })}
                />
                <span style={{ color: 'var(--gray-400)' }}>–</span>
                <input
                  type="time" className="form-input" style={{ width: 120, opacity: row.closed ? 0.5 : 1 }}
                  value={row.close} disabled={row.closed}
                  onChange={e => updateDay(day, { close: e.target.value })}
                />
              </div>
            )
          })}
        </div>
      )}

      <div className="h-px bg-surface-border" style={{ margin: '14px 0 10px' }} />

      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--brand-700)', margin: 0 }}>{t('blackoutDates')}</h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', margin: '2px 0 0' }}>{t('blackoutDatesHint')}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: blackoutDates.length ? 10 : 0 }}>
        <input
          type="date" className="form-input" style={{ width: 'auto' }}
          onChange={e => { addBlackout(e.target.value); e.target.value = '' }}
          aria-label={t('addDate')}
        />
        <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> {t('addDate')}
        </span>
      </div>

      {blackoutDates.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {blackoutDates.map(d => (
            <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 20, fontSize: '0.75rem', background: 'var(--gray-100)', color: 'var(--gray-700)', fontVariantNumeric: 'tabular-nums' }}>
              {d}
              <button type="button" onClick={() => removeBlackout(d)} aria-label={t('remove')} style={{ display: 'inline-flex', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', margin: 0 }}>{t('noBlackoutDates')}</p>
      )}
    </div>
  )
}
