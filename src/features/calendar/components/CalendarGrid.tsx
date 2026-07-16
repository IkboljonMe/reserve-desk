'use client'

import { startOfWeek, addDays } from 'date-fns'
import TimeGrid from './TimeGrid'
import MonthView from './MonthView'
import Spinner from '@/components/ui/Spinner'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarGrid({ s }: { s: CalendarPageState }) {
  const { loadingBookings, view, currentDate, today, bookingsForDay, setSelectedBooking, markFinished, setCurrentDate, setView, rowH, goToCreate } = s

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm flex-1 overflow-auto p-0 relative min-h-0 max-[860px]:flex-none max-[860px]:min-h-[70vh]">
      {loadingBookings && (
        <div className="absolute inset-0 bg-white/45 backdrop-blur-md z-20 flex items-center justify-center [animation:fadeIn_0.2s_ease]">
          <Spinner size={34} borderWidth={3} />
        </div>
      )}

      {view === 'month' ? (
        <MonthView
          currentDate={currentDate}
          today={today}
          bookingsForDay={bookingsForDay}
          onDayClick={d => { setCurrentDate(d); setView('day') }}
          onBookingClick={setSelectedBooking}
          onFinish={markFinished}
        />
      ) : (
        <TimeGrid
          days={view === 'day'
            ? [currentDate]
            : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i))}
          today={today}
          rowH={rowH}
          bookingsForDay={bookingsForDay}
          onCreate={goToCreate}
          onBookingClick={setSelectedBooking}
          onFinish={markFinished}
          onDayHeaderClick={view === 'week' ? (d => { setCurrentDate(d); setView('day') }) : undefined}
        />
      )}
    </div>
  )
}
