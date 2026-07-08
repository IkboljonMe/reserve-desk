'use client'

import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Dropdown from '@/components/ui/Dropdown'
import type { ViewMode, Density } from '../constants'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarToolbar({ s }: { s: CalendarPageState }) {
  const { navigate, setCurrentDate, headerLabel, view, setView, density, setDensity, goToCreate, currentDate } = s

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="cal-icon-btn" onClick={() => navigate(-1)} aria-label="Previous"><ChevronLeft size={16} /></button>
        <button className="cal-pill" onClick={() => setCurrentDate(new Date())} style={{ minWidth: 52, justifyContent: 'center' }}>Today</button>
        <button className="cal-icon-btn" onClick={() => navigate(1)} aria-label="Next"><ChevronRight size={16} /></button>
      </div>
      <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>{headerLabel}</span>

      <div style={{ marginLeft: 'auto', minWidth: 110 }}>
        <Dropdown
          value={view}
          onChange={val => setView(val as ViewMode)}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />
      </div>

      {view !== 'month' && (
        <div style={{ minWidth: 80 }}>
          <Dropdown
            value={density}
            onChange={val => setDensity(val as Density)}
            options={[
              { value: 'Compact', label: 'S' },
              { value: 'Cozy', label: 'M' },
              { value: 'Roomy', label: 'L' },
            ]}
          />
        </div>
      )}

      <button className="btn btn-primary btn-sm" onClick={() => goToCreate(format(currentDate, 'yyyy-MM-dd'))}>
        <Plus size={14} strokeWidth={2.5} /> New
      </button>
    </div>
  )
}
