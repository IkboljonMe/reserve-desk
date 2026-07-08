'use client'

import { useCalendarPage } from './useCalendarPage'
import { CalendarStyles } from './components/CalendarStyles'
import { CalendarToolbar } from './components/CalendarToolbar'
import { CalendarFilters } from './components/CalendarFilters'
import { CalendarGrid } from './components/CalendarGrid'
import { CalendarSidebar } from './components/CalendarSidebar'
import { BookingDetailModal } from './components/BookingDetailModal'
import { PayConfirmModal } from './components/PayConfirmModal'

export default function CalendarPage() {
  const s = useCalendarPage()

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: '100%', minHeight: 0 }}>
      <CalendarStyles />

      {/* ── Main column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <CalendarToolbar s={s} />
        <CalendarFilters s={s} />
        <CalendarGrid s={s} />
      </div>

      {/* ── Sidebar ── */}
      <CalendarSidebar s={s} />

      <BookingDetailModal s={s} />
      <PayConfirmModal s={s} />
    </div>
  )
}
