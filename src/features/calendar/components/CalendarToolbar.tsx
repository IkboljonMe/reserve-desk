'use client'

import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Dropdown from '@/components/ui/Dropdown'
import Button from '@/components/ui/Button'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { ViewMode, Density, StatusFilter } from '../constants'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarToolbar({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const {
    navigate, setCurrentDate, headerLabel, view, setView, density, setDensity,
    goToCreate, currentDate, statusFilter, setStatusFilter,
  } = s

  const navGroup = (
    <div className={`flex items-center gap-1 ${isMobile ? 'justify-center pb-0' : 'pb-0.5'}`}>
      <button className="cal-icon-btn" onClick={() => navigate(-1)} aria-label={t('previous')}><ChevronLeft size={16} /></button>
      <button className="cal-pill min-w-[52px] justify-center" onClick={() => setCurrentDate(new Date())}>{t('today')}</button>
      <button className="cal-icon-btn" onClick={() => navigate(1)} aria-label={t('next')}><ChevronRight size={16} /></button>
    </div>
  )

  const viewDropdown = (
    <Dropdown
      label={t('view')}
      value={view}
      onChange={val => setView(val as ViewMode)}
      options={[
        { value: 'day', label: t('day') },
        { value: 'week', label: t('periodWeek') },
        { value: 'month', label: t('periodMonth') },
      ]}
    />
  )

  const densityDropdown = view !== 'month' && (
    <Dropdown
      label={t('density')}
      value={density}
      onChange={val => setDensity(val as Density)}
      options={[
        { value: 'Compact', label: 'S' },
        { value: 'Cozy', label: 'M' },
        { value: 'Roomy', label: 'L' },
      ]}
    />
  )

  const statusDropdown = (
    <Dropdown
      label={t('status')}
      value={statusFilter}
      onChange={val => setStatusFilter(val as StatusFilter)}
      options={[
        { value: 'all', label: t('allStatuses') },
        { value: 'unpaid', label: t('unpaid') },
        { value: 'paid', label: t('paid') },
        { value: 'finished', label: t('finished') },
      ]}
    />
  )

  const newBookingBtn = (
    <Button
      variant="primary" size="md" leftIcon={<Plus size={14} strokeWidth={2.5} />}
      className={isMobile ? "w-full justify-center" : undefined}
      onClick={() => goToCreate(format(currentDate, 'yyyy-MM-dd'))}
    >
      {t('newBooking')}
    </Button>
  )

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2.5 mb-3.5">
        <span className="font-bold text-[var(--gray-800)] text-[1.0625rem] tracking-tight text-center">
          {headerLabel}
        </span>
        {navGroup}
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">{viewDropdown}</div>
          {densityDropdown && <div className="flex-1 min-w-0">{densityDropdown}</div>}
          <div className="flex-1 min-w-0">{statusDropdown}</div>
        </div>
        {newBookingBtn}
      </div>
    )
  }

  return (
    <div className="flex items-end gap-3 mb-3 flex-wrap">
      {navGroup}
      <span className="font-bold text-[var(--gray-800)] text-[1.0625rem] tracking-tight pb-0.5">{headerLabel}</span>

      <div className="ml-auto min-w-[110px]">{viewDropdown}</div>

      {densityDropdown && <div className="min-w-[80px]">{densityDropdown}</div>}

      {newBookingBtn}
    </div>
  )
}
