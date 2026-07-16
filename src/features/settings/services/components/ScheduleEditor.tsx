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
    <div className="bg-[var(--surface-card)] border border-[var(--brand-100,#e0e7ff)] rounded-[var(--radius-lg)] shadow-sm p-4 bg-[#fcfdff]">
      <div className="mb-3">
        <h3 className="text-[0.9rem] font-bold text-[var(--brand-700,#4338ca)] m-0">{t('weeklySchedule')}</h3>
        <p className="text-[0.72rem] text-[var(--gray-500)] mt-0.5">{t('weeklyScheduleHint')}</p>
      </div>

      <label className={`flex items-center gap-2 text-[0.82rem] cursor-pointer ${custom ? 'mb-3' : 'mb-0'}`}>
        <input type="checkbox" checked={custom} onChange={e => toggleCustom(e.target.checked)} />
        {t('useCustomHours')}
      </label>

      {!custom && (
        <p className="text-[0.75rem] text-[var(--gray-400)] m-0">{t('defaultHoursApply')}</p>
      )}

      {custom && (
        <div className="flex flex-col gap-1.5">
          {WEEK_ORDER.map(({ day, labelKey }) => {
            const row = byDay(day)
            if (!row) return null
            return (
              <div key={day} className="flex items-center gap-2.5">
                <span className="w-10.5 text-[0.8rem] font-semibold text-[var(--gray-700)]">{t(labelKey)}</span>
                <label className="flex items-center gap-1.25 text-[0.76rem] text-[var(--gray-500)] w-22">
                  <input type="checkbox" checked={!row.closed} onChange={e => updateDay(day, { closed: !e.target.checked })} />
                  {row.closed ? t('dayClosed') : t('dayOpen')}
                </label>
                <input
                  type="time"
                  className={`w-[120px] px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] ${
                    row.closed ? 'opacity-50' : 'opacity-100'
                  }`}
                  value={row.open}
                  disabled={row.closed}
                  onChange={e => updateDay(day, { open: e.target.value })}
                />
                <span className="text-[var(--gray-400)]">–</span>
                <input
                  type="time"
                  className={`w-[120px] px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] ${
                    row.closed ? 'opacity-50' : 'opacity-100'
                  }`}
                  value={row.close}
                  disabled={row.closed}
                  onChange={e => updateDay(day, { close: e.target.value })}
                />
              </div>
            )
          })}
        </div>
      )}

      <div className="h-px bg-surface-border my-3.5" />

      <div className="mb-2">
        <h3 className="text-[0.9rem] font-bold text-[var(--brand-700,#4338ca)] m-0">{t('blackoutDates')}</h3>
        <p className="text-[0.72rem] text-[var(--gray-500)] mt-0.5">{t('blackoutDatesHint')}</p>
      </div>

      <div className={`flex items-center gap-2 ${blackoutDates.length ? 'mb-2.5' : 'mb-0'}`}>
        <input
          type="date"
          className="w-auto px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-[var(--gray-200,#e5e7eb)] text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          onChange={e => { addBlackout(e.target.value); e.target.value = '' }}
          aria-label={t('addDate')}
        />
        <span className="text-[0.72rem] text-[var(--gray-400)] inline-flex items-center gap-1">
          <Plus size={12} /> {t('addDate')}
        </span>
      </div>

      {blackoutDates.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {blackoutDates.map(d => (
            <span key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] bg-[var(--gray-100,#f3f4f6)] text-[var(--gray-700,#374151)] font-semibold tabular-nums">
              {d}
              <button type="button" onClick={() => removeBlackout(d)} aria-label={t('remove')} className="inline-flex text-[var(--gray-400,#9ca3af)] hover:text-[var(--danger,#ef4444)] bg-transparent border-0 cursor-pointer p-0">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[0.75rem] text-[var(--gray-400)] m-0">{t('noBlackoutDates')}</p>
      )}
    </div>
  )
}
