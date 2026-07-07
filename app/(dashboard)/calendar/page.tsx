'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from 'date-fns'
import { useToast } from '@/components/ToastProvider'
import { getServiceIcon } from '@/lib/serviceIcons'

interface Service { _id: string; name: string; color: string; isActive: boolean }
interface Booking {
  _id: string
  serviceId: { _id: string; name: string; color: string }
  customerName: string
  customerPhone: string
  roomNumber: string
  date: string
  startTime: string
  endTime: string
  notes: string
  status: string
  totalPrice: number
}

type ViewMode = 'day' | 'week' | 'month'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 7am–11pm

export default function CalendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const [today] = useState(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = searchParams.get('date')
    return d ? parseISO(d) : new Date()
  })
  const [view, setView] = useState<ViewMode>('week')
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load services
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then((data: Service[]) => {
        setServices(data.filter(s => s.isActive))
        setSelectedServices(new Set(data.map(s => s._id)))
      })
  }, [])

  // Determine date range for query
  const getDateRange = useCallback(() => {
    if (view === 'day') {
      const d = format(currentDate, 'yyyy-MM-dd')
      return { from: d, to: d }
    }
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return {
        from: format(start, 'yyyy-MM-dd'),
        to: format(addDays(start, 6), 'yyyy-MM-dd'),
      }
    }
    // month
    return {
      from: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
      to: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
    }
  }, [view, currentDate])

  // Load bookings
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true)
    try {
      const { from, to } = getDateRange()
      const res = await fetch(`/api/bookings?dateFrom=${from}&dateTo=${to}`)
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } finally {
      setLoadingBookings(false)
    }
  }, [getDateRange])

  useEffect(() => { loadBookings() }, [loadBookings])

  const navigate = (dir: -1 | 1) => {
    if (view === 'day') setCurrentDate(d => addDays(d, dir))
    else if (view === 'week') setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
  }

  const filteredBookings = bookings.filter(b =>
    b.serviceId && selectedServices.has(typeof b.serviceId === 'string' ? b.serviceId : b.serviceId._id)
  )

  const getBookingsForDay = (dateStr: string) =>
    filteredBookings.filter(b => b.date === dateStr && b.status !== 'cancelled')

  async function handleDeleteBooking(id: string) {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Booking deleted', 'success')
      setSelectedBooking(null)
      setDeleteConfirm(null)
      loadBookings()
    } else {
      showToast('Failed to delete booking', 'error')
    }
  }

  const headerLabel = view === 'day'
    ? format(currentDate, 'EEEE, MMMM d, yyyy')
    : view === 'week'
    ? (() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(start, 'MMM d')} – ${format(addDays(start, 6), 'MMM d, yyyy')}`
      })()
    : format(currentDate, 'MMMM yyyy')

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: '100%' }}>

      {/* Main Calendar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          marginBottom: '1rem', flexWrap: 'wrap',
        }}>
          <h1 style={{ fontSize: '1.25rem', marginRight: 4 }}>Calendar</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(-1)} aria-label="Previous">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())} style={{ minWidth: 44 }}>
              Today
            </button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(1)} aria-label="Next">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <span style={{ fontWeight: 600, color: 'var(--gray-700)', fontSize: '0.9375rem' }}>{headerLabel}</span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button
                key={v}
                className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView(v)}
                style={{ textTransform: 'capitalize' }}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            id="new-booking-btn"
            className="btn btn-primary btn-sm"
            onClick={() => router.push(`/book?date=${format(currentDate, 'yyyy-MM-dd')}`)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="card" style={{ flex: 1, overflow: 'auto', padding: 0, position: 'relative' }}>
          {loadingBookings && (
            <div style={{ 
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', 
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'fadeIn 0.2s ease', borderRadius: 12 
            }}>
              <div className="spinner spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
            </div>
          )}
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              today={today}
              getBookingsForDay={getBookingsForDay}
              onDayClick={d => { setCurrentDate(d); setView('day') }}
              onBookingClick={setSelectedBooking}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              today={today}
              getBookingsForDay={getBookingsForDay}
              onSlotClick={(d, h) => router.push(`/book?date=${format(d, 'yyyy-MM-dd')}&time=${h.toString().padStart(2, '0')}:00`)}
              onBookingClick={setSelectedBooking}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              getBookingsForDay={getBookingsForDay}
              onSlotClick={h => router.push(`/book?date=${format(currentDate, 'yyyy-MM-dd')}&time=${h.toString().padStart(2, '0')}:00`)}
              onBookingClick={setSelectedBooking}
            />
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Services</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {services.map(svc => {
              const checked = selectedServices.has(svc._id)
              return (
                <label key={svc._id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedServices(prev => {
                        const next = new Set(prev)
                        if (checked) next.delete(svc._id)
                        else next.add(svc._id)
                        return next
                      })
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: checked ? `${svc.color}18` : 'var(--gray-100)',
                    color: checked ? svc.color : 'var(--gray-300)',
                    border: `1.5px solid ${checked ? svc.color : 'transparent'}`,
                    transition: 'all 0.12s',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {getServiceIcon(svc.name)}
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: checked ? 'var(--gray-800)' : 'var(--gray-400)' }}>{svc.name}</span>
                </label>
              )
            })}
            {services.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>No services yet</p>}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={() => router.push(`/book?date=${format(currentDate, 'yyyy-MM-dd')}`)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Booking
        </button>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              {/* Service badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedBooking.serviceId?.color || '#6366f1' }} />
                <strong style={{ color: 'var(--gray-800)' }}>{selectedBooking.serviceId?.name}</strong>
                <span className={`badge ${selectedBooking.status === 'confirmed' ? 'badge-success' : selectedBooking.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ marginLeft: 'auto' }}>
                  {selectedBooking.status}
                </span>
              </div>

              <div className="divider" style={{ margin: '0.25rem 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.4rem', color: 'var(--gray-600)' }}>
                <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Guest</span>
                <span>{selectedBooking.customerName}</span>
                {selectedBooking.roomNumber && <>
                  <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Room</span>
                  <span style={{ fontWeight: 600, color: 'var(--brand-600)' }}>🏨 {selectedBooking.roomNumber}</span>
                </>}
                {selectedBooking.customerPhone && <>
                  <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Phone</span>
                  <span>{selectedBooking.customerPhone}</span>
                </>}
                <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Date</span>
                <span>{selectedBooking.date}</span>
                <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Time</span>
                <span>{selectedBooking.startTime} – {selectedBooking.endTime}</span>
                {selectedBooking.totalPrice > 0 && <>
                  <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Price</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>{selectedBooking.totalPrice.toLocaleString()} UZS</span>
                </>}
                {selectedBooking.notes && <>
                  <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>Notes</span>
                  <span>{selectedBooking.notes}</span>
                </>}
              </div>
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {deleteConfirm === selectedBooking._id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>Sure?</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBooking(selectedBooking._id)}>Delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(selectedBooking._id)}>
                  Delete Booking
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────── Sub-Views ──────────────── */

function MonthView({ currentDate, today, getBookingsForDay, onDayClick, onBookingClick }: {
  currentDate: Date
  today: Date
  getBookingsForDay: (d: string) => Booking[]
  onDayClick: (d: Date) => void
  onBookingClick: (b: Booking) => void
}) {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const end = addDays(startOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 6)
  const days = eachDayOfInterval({ start, end })
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayBookings = getBookingsForDay(dateStr)
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, currentDate)
          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(day)}
              style={{
                minHeight: 90,
                padding: '6px',
                borderRadius: 8,
                background: isToday ? 'var(--brand-50)' : isCurrentMonth ? '#fff' : 'var(--gray-50)',
                border: `1px solid ${isToday ? 'var(--brand-500)' : 'var(--gray-200)'}`,
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: isToday ? 700 : 500,
                marginBottom: 4,
                width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%',
                background: isToday ? 'var(--brand-500)' : 'transparent',
                color: isToday ? '#fff' : isCurrentMonth ? 'var(--gray-700)' : 'var(--gray-300)',
              }}>
                {format(day, 'd')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayBookings.slice(0, 3).map(b => (
                  <div
                    key={b._id}
                    onClick={e => { e.stopPropagation(); onBookingClick(b) }}
                    style={{
                      background: b.serviceId?.color || '#6366f1',
                      color: '#fff',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {b.startTime} {b.customerName}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', paddingLeft: 2 }}>+{dayBookings.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ currentDate, today, getBookingsForDay, onSlotClick, onBookingClick }: {
  currentDate: Date
  today: Date
  getBookingsForDay: (d: string) => Booking[]
  onSlotClick: (d: Date, h: number) => void
  onBookingClick: (b: Booking) => void
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div style={{ overflow: 'auto', maxHeight: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '52px repeat(7, 1fr)',
        borderBottom: '1px solid var(--gray-200)',
        position: 'sticky', top: 0, background: '#fff', zIndex: 2,
      }}>
        <div />
        {days.map(day => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} style={{
              textAlign: 'center', padding: '10px 4px',
              borderLeft: '1px solid var(--gray-100)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {format(day, 'EEE')}
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', margin: '2px auto 0',
                background: isToday ? 'var(--brand-500)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: isToday ? 700 : 500,
                color: isToday ? '#fff' : 'var(--gray-700)',
              }}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hour rows */}
      {HOURS.map(hour => (
        <div key={hour} style={{
          display: 'grid',
          gridTemplateColumns: '52px repeat(7, 1fr)',
          borderBottom: '1px solid var(--gray-100)',
          minHeight: 56,
        }}>
          <div className="tabular-nums" style={{
            fontSize: '0.7rem', color: 'var(--gray-400)', padding: '4px 8px', textAlign: 'right',
            lineHeight: 1,
          }}>
            {hour.toString().padStart(2, '0')}:00
          </div>
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const hourStr = `${hour.toString().padStart(2, '0')}:00`
            const dayBookings = getBookingsForDay(dateStr).filter(b => b.startTime === hourStr)
            return (
              <div
                key={day.toISOString()}
                style={{
                  borderLeft: '1px solid var(--gray-100)',
                  padding: '2px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onClick={() => onSlotClick(day, hour)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {dayBookings.map(b => (
                  <BookingChip key={b._id} booking={b} onClick={onBookingClick} />
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function DayView({ currentDate, getBookingsForDay, onSlotClick, onBookingClick }: {
  currentDate: Date
  getBookingsForDay: (d: string) => Booking[]
  onSlotClick: (h: number) => void
  onBookingClick: (b: Booking) => void
}) {
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const dayBookings = getBookingsForDay(dateStr)

  return (
    <div style={{ overflow: 'auto', maxHeight: '100%' }}>
      {HOURS.map(hour => {
        const hourStr = `${hour.toString().padStart(2, '0')}:00`
        const slotBookings = dayBookings.filter(b => b.startTime === hourStr)
        return (
          <div key={hour} style={{
            display: 'flex',
            borderBottom: '1px solid var(--gray-100)',
            minHeight: 64,
          }}>
            <div className="tabular-nums" style={{
              width: 60, flexShrink: 0,
              fontSize: '0.7rem', color: 'var(--gray-400)', padding: '8px',
              textAlign: 'right',
            }}>
              {hourStr}
            </div>
            <div
              style={{
                flex: 1, padding: '4px 8px',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onClick={() => onSlotClick(hour)}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {slotBookings.map(b => (
                <BookingChip key={b._id} booking={b} onClick={onBookingClick} expanded />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BookingChip({ booking, onClick, expanded = false }: { booking: Booking; onClick: (b: Booking) => void; expanded?: boolean }) {
  const color = booking.serviceId?.color || '#6366f1'
  const label = booking.roomNumber ? `Room ${booking.roomNumber}` : booking.customerName
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(booking) }}
      style={{
        background: `${color}20`,
        border: `1.5px solid ${color}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 6,
        padding: expanded ? '6px 10px' : '3px 8px',
        fontSize: '0.75rem',
        color: 'var(--gray-800)',
        cursor: 'pointer',
        marginBottom: 2,
        transition: 'opacity 0.1s',
        lineHeight: 1.4,
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
    >
      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{label}</div>
      {expanded && (
        <div style={{ color: 'var(--gray-500)', fontSize: '0.7rem' }}>
          {booking.customerName} · {booking.serviceId?.name} · {booking.startTime}–{booking.endTime}
        </div>
      )}
    </div>
  )
}
