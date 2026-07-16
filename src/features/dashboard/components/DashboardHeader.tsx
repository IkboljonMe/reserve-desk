'use client'

import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { nowUZ } from '@/lib/timezone'
import { dateLocale } from '@/lib/dateLocale'
import { useBookingModal } from '@/components/BookingModalProvider'
import { useTranslation } from '@/i18n'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Calendar from '@/components/ui/Calendar'
import type { PeriodKey } from '../utils'
import type { DashboardPageState } from '../useDashboardPage'

export function DashboardHeader({ s }: { s: DashboardPageState }) {
  const { t, lang } = useTranslation()
  const locale = dateLocale(lang)
  const { openBookingModal } = useBookingModal()
  const { period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo } = s
  const [pickerOpen, setPickerOpen] = useState(false)
  // Draft selection while the popover is open. Kept separate from customFrom/customTo
  // so `to` can stay genuinely null between the two picks — collapsing it into a
  // same-day value here would make the calendar think the range is already complete
  // and reset instead of accepting the second click.
  const [draftFrom, setDraftFrom] = useState<Date | null>(null)
  const [draftTo, setDraftTo] = useState<Date | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen) return
    function onDoc(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [pickerOpen])

  function openPicker() {
    setDraftFrom(null)
    setDraftTo(null)
    setPickerOpen(true)
  }

  const periodOptions = ([
    ['week', t('periodWeek')], ['month', t('periodMonth')], ['7d', '7d'], ['30d', '30d'], ['custom', t('periodCustom')],
  ] as [PeriodKey, string][]).map(([value, label]) => ({ value, label }))

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1>{t('dashboard')}</h1>
        <p style={{ marginTop: 4 }}>{format(nowUZ(), 'EEEE, MMMM d, yyyy', { locale })}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 140 }}>
          <Dropdown
            value={period}
            onChange={v => {
              setPeriod(v as PeriodKey)
              if (v === 'custom') openPicker()
              else setPickerOpen(false)
            }}
            options={periodOptions}
            ariaLabel={t('dashboard')}
          />
        </div>
        {period === 'custom' && (
          <div ref={pickerRef} style={{ position: 'relative' }}>
            <Button variant="secondary" size="md" leftIcon={<CalendarIcon size={14} />} onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}>
              {format(new Date(customFrom), 'MMM d', { locale })} – {format(new Date(customTo), 'MMM d', { locale })}
            </Button>
            {pickerOpen && (
              <div className="dash-date-popover">
                <Calendar
                  mode="range"
                  locale={locale}
                  range={{ from: draftFrom, to: draftTo }}
                  onRangeChange={r => {
                    setDraftFrom(r.from)
                    setDraftTo(r.to)
                    if (r.from && r.to) {
                      setCustomFrom(format(r.from, 'yyyy-MM-dd'))
                      setCustomTo(format(r.to, 'yyyy-MM-dd'))
                      setPickerOpen(false)
                    }
                  }}
                  maxDate={nowUZ()}
                />
              </div>
            )}
          </div>
        )}
        <Button variant="primary" size="md" leftIcon={<Plus size={14} strokeWidth={2.5} />} onClick={() => openBookingModal({ date: format(nowUZ(), 'yyyy-MM-dd') })}>
          {t('newBooking')}
        </Button>
      </div>
    </div>
  )
}
