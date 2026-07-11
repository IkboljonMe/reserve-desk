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
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: isMobile ? 'center' : undefined, paddingBottom: isMobile ? 0 : 2 }}>
      <button className="cal-icon-btn" onClick={() => navigate(-1)} aria-label={t('previous')}><ChevronLeft size={16} /></button>
      <button className="cal-pill" onClick={() => setCurrentDate(new Date())} style={{ minWidth: 52, justifyContent: 'center' }}>{t('today')}</button>
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
      style={isMobile ? { width: '100%', justifyContent: 'center' } : undefined}
      onClick={() => goToCreate(format(currentDate, 'yyyy-MM-dd'))}
    >
      {t('newBooking')}
    </Button>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '0.85rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '1.0625rem', letterSpacing: '-0.01em', textAlign: 'center' }}>
          {headerLabel}
        </span>
        {navGroup}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>{viewDropdown}</div>
          {densityDropdown && <div style={{ flex: 1, minWidth: 0 }}>{densityDropdown}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>{statusDropdown}</div>
        </div>
        {newBookingBtn}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
      {navGroup}
      <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '1.0625rem', letterSpacing: '-0.01em', paddingBottom: 2 }}>{headerLabel}</span>

      <div style={{ marginLeft: 'auto', minWidth: 110 }}>{viewDropdown}</div>

      {densityDropdown && <div style={{ minWidth: 80 }}>{densityDropdown}</div>}

      {newBookingBtn}
    </div>
  )
}
