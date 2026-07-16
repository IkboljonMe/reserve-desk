'use client'

import { startOfWeek, addDays } from 'date-fns'
import TimeGrid from './TimeGrid'
import MonthView from './MonthView'
import Spinner from '@/components/ui/Spinner'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarGrid({ s }: { s: CalendarPageState }) {
  const { loadingBookings, view, currentDate, today, bookingsForDay, setSelectedBooking, markFinished, setCurrentDate, setView, rowH, goToCreate } = s

  return (
    <div className="card cal-grid-card">
      {loadingBookings && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
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
