'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth,
  parseISO, addMonths, subMonths,
} from 'date-fns'
import { useToast } from '@/components/ToastProvider'
import Dropdown from '@/components/ui/Dropdown'
import { getServiceIcon } from '@/lib/serviceIcons'
import {
  ChevronLeft, ChevronRight, Plus, Search, X, Check, Clock,
  MapPin, Phone, User, Trash2, CalendarDays, Building2, Wallet,
} from 'lucide-react'
import {
  svcId,
  extractHotelId,
  bookingState,
  money,
  canFinish,
} from '@/lib/bookingHelpers'
import { Booking, Service, Hotel } from '@/types'
import { useServicesQuery } from '@/hooks/useServices'
import { useHotelsQuery } from '@/hooks/useHotels'
import { useBookingsQuery, useUpdateBookingMutation, useDeleteBookingMutation } from '@/hooks/useBookings'
import TimeGrid from '@/components/calendar/TimeGrid'
import MonthView from '@/components/calendar/MonthView'

type ViewMode = 'day' | 'week' | 'month'
type StatusFilter = 'all' | 'unpaid' | 'paid' | 'finished'

const ROW_HEIGHTS = { Compact: 48, Cozy: 64, Roomy: 88 } as const
type Density = keyof typeof ROW_HEIGHTS
const DENSITY_LABEL: Record<Density, string> = { Compact: 'S', Cozy: 'M', Roomy: 'L' }

export default function CalendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const [today, setToday] = useState(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = searchParams.get('date')
    return d ? parseISO(d) : new Date()
  })
  const [view, setView] = useState<ViewMode>('week')
  const [density, setDensity] = useState<Density>('Cozy')
  const { data: services = [] } = useServicesQuery()
  const { data: hotels = [] } = useHotelsQuery()
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set())

  const getDateRange = useCallback(() => {
    if (view === 'day') {
      const d = format(currentDate, 'yyyy-MM-dd')
      return { from: d, to: d }
    }
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return { from: format(start, 'yyyy-MM-dd'), to: format(addDays(start, 6), 'yyyy-MM-dd') }
    }
    return { from: format(startOfMonth(currentDate), 'yyyy-MM-dd'), to: format(endOfMonth(currentDate), 'yyyy-MM-dd') }
  }, [view, currentDate])

  const { from: dateFrom, to: dateTo } = useMemo(() => getDateRange(), [getDateRange])
  const { data: bookings = [], isLoading: loadingBookings } = useBookingsQuery(dateFrom, dateTo)

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [payConfirm, setPayConfirm] = useState<Booking | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const rowH = ROW_HEIGHTS[density]

  // Map each service to its hotel (services are populated with hotelId).
  const serviceHotel = useMemo(() => {
    const m = new Map<string, string>()
    services.forEach(s => m.set(s._id, extractHotelId(s.hotelId)))
    return m
  }, [services])

  // Keep "now" fresh for the current-time indicator
  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Initialize selections once data is loaded
  useEffect(() => {
    if (services.length > 0 && selectedServices.size === 0) {
      const active = services.filter(s => s.isActive)
      setSelectedServices(new Set(active.map(s => s._id)))
    }
  }, [services])

  useEffect(() => {
    if (hotels.length > 0 && selectedHotels.size === 0) {
      setSelectedHotels(new Set(hotels.map(h => h._id)))
    }
  }, [hotels])

  const navigate = (dir: -1 | 1) => {
    if (view === 'day') setCurrentDate(d => addDays(d, dir))
    else if (view === 'week') setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
  }

  const knownHotelIds = useMemo(() => new Set(hotels.map(h => h._id)), [hotels])

  // Apply all filters
  const visibleBookings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter(b => {
      if (!b.serviceId) return false
      if (b.status === 'cancelled') return false
      if (!selectedServices.has(svcId(b))) return false
      // Only apply the hotel filter to hotels the viewer can actually filter by.
      // A shared service is owned by a hotel that may not be in this viewer's
      // pill list; its bookings (incl. masked occupancy) should still show.
      const hid = serviceHotel.get(svcId(b)) || ''
      if (hid && knownHotelIds.has(hid) && !selectedHotels.has(hid)) return false
      if (statusFilter !== 'all') {
        const st = bookingState(b).key
        if (statusFilter === 'unpaid' && st !== 'unpaid') return false
        if (statusFilter === 'paid' && !(st === 'paid' || st === 'free')) return false
        if (statusFilter === 'finished' && st !== 'finished') return false
      }
      if (q) {
        const hay = `${b.customerName} ${b.roomNumber} ${b.customerPhone}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [bookings, selectedServices, selectedHotels, serviceHotel, knownHotelIds, statusFilter, search])

  const bookingsForDay = useCallback(
    (dateStr: string) => visibleBookings.filter(b => b.date === dateStr),
    [visibleBookings],
  )

  // Summary of the visible range
  const summary = useMemo(() => {
    const own = visibleBookings.filter(b => !b.masked)
    const count = own.length
    const revenue = own.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const collected = own
      .filter(b => b.paid || (b.totalPrice || 0) === 0)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    return { count, revenue, collected }
  }, [visibleBookings])

  const updateMutation = useUpdateBookingMutation()
  const deleteMutation = useDeleteBookingMutation()

  async function updateBooking(id: string, changes: Partial<Booking>, successMsg: string) {
    try {
      const payload: any = { ...changes }
      if (changes.serviceId && typeof changes.serviceId === 'object') {
        payload.serviceId = changes.serviceId._id
      }
      await updateMutation.mutateAsync({ id, data: payload })
      setSelectedBooking(prev => (prev && prev._id === id ? { ...prev, ...changes } : prev))
      showToast(successMsg, 'success')
    } catch {
      showToast('Update failed', 'error')
    }
  }

  const markPaid = (b: Booking) => updateBooking(b._id, { paid: true }, 'Marked as paid')
  const markFinished = (b: Booking) => updateBooking(b._id, { finished: true }, 'Booking completed')

  async function handleDeleteBooking(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      showToast('Booking deleted', 'success')
      setSelectedBooking(null)
      setDeleteConfirm(null)
    } catch {
      showToast('Failed to delete booking', 'error')
    }
  }

  const goToCreate = (dateStr: string, time?: string) =>
    router.push(`/book?date=${dateStr}${time ? `&time=${time}` : ''}`)

  const headerLabel = view === 'day'
    ? format(currentDate, 'EEEE, MMMM d, yyyy')
    : view === 'week'
      ? (() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(start, 'MMM d')} – ${format(addDays(start, 6), 'MMM d, yyyy')}`
      })()
      : format(currentDate, 'MMMM yyyy')

  const allSelected = services.length > 0 && selectedServices.size === services.length
  const allHotelsSelected = hotels.length > 0 && selectedHotels.size === hotels.length

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: '100%', minHeight: 0 }}>
      <style>{`
        .cal-seg { display:inline-flex; background:var(--gray-100); border-radius:10px; padding:3px; gap:2px; }
        .cal-seg button { border:none; background:transparent; padding:5px 12px; border-radius:7px; font-size:0.8rem;
          font-weight:600; color:var(--gray-500); cursor:pointer; transition:all .15s; text-transform:capitalize; font-family:inherit; }
        .cal-seg button.active { background:#fff; color:var(--brand-700); box-shadow:var(--shadow-xs); }
        .cal-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px;
          font-size:0.78rem; font-weight:600; cursor:pointer; border:1.5px solid var(--gray-200);
          background:var(--surface-card); color:var(--gray-600); transition:all .15s; font-family:inherit; white-space:nowrap; }
        .cal-pill:hover { border-color:var(--brand-400); color:var(--brand-700); }
        .cal-pill.active { background:var(--brand-gradient,var(--brand-500)); color:#fff; border-color:transparent; }
        .cal-event { position:absolute; border-radius:7px; overflow:hidden; cursor:pointer;
          transition:box-shadow .12s, transform .12s, filter .12s; box-sizing:border-box; }
        .cal-event:hover { box-shadow:0 6px 16px rgba(0,0,0,0.14); transform:translateY(-1px); z-index:5; filter:saturate(1.15); }
        .cal-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px;
          border-radius:8px; border:1px solid var(--gray-200); background:var(--surface-card); color:var(--gray-600);
          cursor:pointer; transition:all .15s; }
        .cal-icon-btn:hover { border-color:var(--brand-400); color:var(--brand-600); background:var(--brand-50); }
      `}</style>

      {/* ── Main column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {/* Toolbar */}
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

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: '0.82rem' }}
              placeholder="Search guest, room or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 2 }} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ minWidth: 140 }}>
            <Dropdown
              value={statusFilter}
              onChange={val => setStatusFilter(val as StatusFilter)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'paid', label: 'Paid' },
                { value: 'finished', label: 'Finished' },
              ]}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="card" style={{ flex: 1, overflow: 'auto', padding: 0, position: 'relative', minHeight: 0 }}>
          {loadingBookings && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.45)',
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'fadeIn 0.2s ease',
            }}>
              <div className="spinner spinner-dark" style={{ width: 34, height: 34, borderWidth: 3 }} />
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
      </div>

      {/* ── Sidebar ── */}
      <div style={{ width: 232, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem', overflow: 'auto' }}>
        {/* Range summary */}
        <div className="card" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1 }}>{summary.count}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>Bookings</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-600)', lineHeight: 1 }}>{money(summary.revenue)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>UZS this {view}</div>
            </div>
          </div>
          {summary.revenue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--gray-500)', borderTop: '1px dashed var(--gray-200)', paddingTop: 8 }}>
              <Wallet size={13} style={{ color: '#10b981' }} />
              <span style={{ fontWeight: 700, color: '#059669' }}>{money(summary.collected)}</span> collected
              {summary.collected < summary.revenue && (
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#d97706' }}>{money(summary.revenue - summary.collected)} due</span>
              )}
            </div>
          )}
        </div>

        {/* Hotel filter */}
        {hotels.length > 0 && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.8125rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} style={{ color: 'var(--gray-400)' }} /> Hotels
              </h3>
              <button
                onClick={() => setSelectedHotels(allHotelsSelected ? new Set() : new Set(hotels.map(h => h._id)))}
                style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {allHotelsSelected ? 'Clear' : 'All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {hotels.map(h => {
                const checked = selectedHotels.has(h._id)
                const count = visibleBookings.filter(b => (serviceHotel.get(svcId(b)) || '') === h._id).length
                return (
                  <button
                    key={h._id}
                    onClick={() => setSelectedHotels(prev => {
                      const next = new Set(prev)
                      if (checked) next.delete(h._id); else next.add(h._id)
                      return next
                    })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                      padding: '5px 7px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: checked ? 'var(--brand-50)' : 'transparent',
                      opacity: checked ? 1 : 0.5, transition: 'all .12s', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{
                      minWidth: 30, height: 22, padding: '0 6px', borderRadius: 6, flexShrink: 0,
                      background: checked ? 'var(--brand-500)' : 'var(--gray-200)',
                      color: checked ? '#fff' : 'var(--gray-500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.66rem', letterSpacing: '0.03em',
                    }}>
                      {h.shortName}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-700)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: checked ? 600 : 400 }}>
                      {h.name}
                    </span>
                    {count > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand-600)', background: 'var(--brand-100)', borderRadius: 999, padding: '1px 7px' }}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Service filter / legend */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8125rem', margin: 0 }}>Services</h3>
            <button
              onClick={() => setSelectedServices(allSelected ? new Set() : new Set(services.map(s => s._id)))}
              style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {allSelected ? 'Clear' : 'All'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {services.map(svc => {
              const checked = selectedServices.has(svc._id)
              const count = visibleBookings.filter(b => svcId(b) === svc._id && b.status !== 'cancelled').length
              return (
                <button
                  key={svc._id}
                  onClick={() => setSelectedServices(prev => {
                    const next = new Set(prev)
                    if (checked) next.delete(svc._id); else next.add(svc._id)
                    return next
                  })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                    padding: '5px 7px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: checked ? `${svc.color}0f` : 'transparent',
                    opacity: checked ? 1 : 0.5, transition: 'all .12s', fontFamily: 'inherit',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: `${svc.color}22`, color: svc.color,
                    border: `1.5px solid ${checked ? svc.color : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {getServiceIcon(svc.name)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-700)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: checked ? 600 : 400 }}>
                    {svc.name}
                  </span>
                  {count > 0 && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: svc.color, background: `${svc.color}18`, borderRadius: 999, padding: '1px 7px' }}>{count}</span>
                  )}
                </button>
              )
            })}
            {services.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>No services yet</p>}
          </div>
        </div>
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }} aria-label="Close"><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem',
                borderRadius: 10, background: `${selectedBooking.serviceId?.color || '#6366f1'}12`,
                border: `1px solid ${selectedBooking.serviceId?.color || '#6366f1'}33`,
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: `${selectedBooking.serviceId?.color || '#6366f1'}22`,
                  color: selectedBooking.serviceId?.color || '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{getServiceIcon(selectedBooking.serviceId?.name || '')}</span>
                <strong style={{ color: 'var(--gray-800)', fontSize: '0.95rem' }}>{selectedBooking.serviceId?.name}</strong>
                {(() => {
                  const st = bookingState(selectedBooking)
                  return (
                    <span className={`badge ${st.badge}`} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {st.key === 'finished' && <Check size={12} />}
                      {st.label}
                    </span>
                  )
                })()}
              </div>

              <DetailRow icon={<User size={15} />} label="Guest" value={selectedBooking.customerName} />
              {selectedBooking.roomNumber && <DetailRow icon={<MapPin size={15} />} label="Room" value={`🏨 ${selectedBooking.roomNumber}`} accent />}
              {selectedBooking.customerPhone && <DetailRow icon={<Phone size={15} />} label="Phone" value={selectedBooking.customerPhone} />}
              <DetailRow icon={<CalendarDays size={15} />} label="Date" value={format(parseISO(selectedBooking.date), 'EEEE, MMM d, yyyy')} />
              <DetailRow icon={<Clock size={15} />} label="Time" value={`${selectedBooking.startTime} – ${selectedBooking.endTime}`} />
              {selectedBooking.totalPrice > 0 && (
                <DetailRow icon={<span style={{ fontWeight: 700, fontSize: 11 }}>UZS</span>} label="Price" value={`${money(selectedBooking.totalPrice)} UZS`} success />
              )}
              <DetailRow
                icon={<Wallet size={15} />}
                label="Payment"
                value={selectedBooking.totalPrice === 0 ? 'Free — no charge' : selectedBooking.paid ? 'Paid' : 'Unpaid'}
                accent={!selectedBooking.paid && selectedBooking.totalPrice > 0}
                success={selectedBooking.paid}
              />
              {selectedBooking.notes && <DetailRow icon={<span style={{ fontSize: 14 }}>📝</span>} label="Notes" value={selectedBooking.notes} />}
            </div>

            <div className="divider" />

            {/* Lifecycle actions */}
            {selectedBooking.finished ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.6rem', marginBottom: '0.85rem', borderRadius: 10, background: '#10b98114', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
                <Check size={16} /> Completed
              </div>
            ) : bookingState(selectedBooking).key === 'unpaid' ? (
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.85rem' }} onClick={() => setPayConfirm(selectedBooking)}>
                <Wallet size={15} /> Mark as Paid
              </button>
            ) : (
              <button
                className="btn"
                style={{ width: '100%', marginBottom: '0.85rem', background: '#10b981', color: '#fff', border: 'none' }}
                onClick={() => markFinished(selectedBooking)}
              >
                <Check size={16} strokeWidth={2.5} /> Mark as Finished
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {deleteConfirm === selectedBooking._id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>Delete this booking?</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBooking(selectedBooking._id)}>Delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(selectedBooking._id)}>
                  <Trash2 size={13} /> Delete
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment confirmation */}
      {payConfirm && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setPayConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 384 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
              <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#10b98118', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={24} />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Confirm payment</h2>
              <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Did you receive <strong style={{ color: 'var(--gray-900)' }}>{money(payConfirm.totalPrice)} UZS</strong>
                {' '}from <strong style={{ color: 'var(--gray-900)' }}>{payConfirm.customerName}</strong>?
              </p>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPayConfirm(null)}>Back</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={async () => { await markPaid(payConfirm); setPayConfirm(null) }}
              >
                <Check size={15} strokeWidth={2.5} /> Yes, received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value, accent, success }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; success?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ color: 'var(--gray-400)', marginTop: 1, width: 18, display: 'flex', justifyContent: 'center' }}>{icon}</span>
      <span style={{ width: 56, color: 'var(--gray-500)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ color: accent ? 'var(--brand-600)' : success ? 'var(--success)' : 'var(--gray-800)', fontWeight: accent || success ? 600 : 400, flex: 1 }}>{value}</span>
    </div>
  )
}


