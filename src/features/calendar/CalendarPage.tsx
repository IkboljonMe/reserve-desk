'use client'

import { useCalendarPage } from './useCalendarPage'
import { CalendarStyles } from './components/CalendarStyles'
import { CalendarToolbar } from './components/CalendarToolbar'
import { CalendarFilters } from './components/CalendarFilters'
import { CalendarGrid } from './components/CalendarGrid'
import { CalendarSidebar } from './components/CalendarSidebar'
import { BookingDetailModal } from './components/BookingDetailModal'
import { PayConfirmModal } from './components/PayConfirmModal'
import { EditBookingModal } from './components/EditBookingModal'

export default function CalendarPage() {
  const s = useCalendarPage()

  return (
    <div className="cal-shell">
      <CalendarStyles />

      {/* ── Main column ── */}
      <div className="cal-main-col">
        <CalendarToolbar s={s} />
        <CalendarFilters s={s} />
        <CalendarGrid s={s} />
      </div>

      {/* ── Sidebar ── */}
      <CalendarSidebar s={s} />

      <BookingDetailModal s={s} />
      <PayConfirmModal s={s} />
      {s.editBooking && <EditBookingModal key={s.editBooking._id} s={s} />}
    </div>
  )
}
