'use client'

import { useCalendarPage } from './useCalendarPage'
import { useIsMobile } from '@/hooks/useIsMobile'
import { CalendarToolbar } from './components/CalendarToolbar'
import { CalendarFilters } from './components/CalendarFilters'
import { CalendarGrid } from './components/CalendarGrid'
import { CalendarSidebar } from './components/CalendarSidebar'
import { BookingDetailModal } from './components/BookingDetailModal'
import { PayConfirmModal } from './components/PayConfirmModal'
import { EditBookingModal } from './components/EditBookingModal'

export default function CalendarPage() {
  const s = useCalendarPage()
  const isMobile = useIsMobile()

  return (
    <div className="flex gap-5 h-full min-h-0 max-[860px]:flex-col max-[860px]:h-auto">
      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* On mobile the summary numbers sit at the very top, then the dates +
            nav/filters row, then the calendar. */}
        {isMobile && (
          <div className="mb-3.5 [&>.cal-sidebar]:flex [&>.cal-sidebar]:flex-col [&>.cal-sidebar]:gap-3">
            <CalendarSidebar s={s} />
          </div>
        )}
        <CalendarToolbar s={s} />
        <CalendarFilters s={s} />
        <CalendarGrid s={s} />
      </div>

      {/* ── Sidebar (desktop right column) ── */}
      {!isMobile && <CalendarSidebar s={s} />}

      <BookingDetailModal s={s} />
      <PayConfirmModal s={s} />
      {s.editBooking && <EditBookingModal key={s.editBooking._id} s={s} />}
    </div>
  )
}
