'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO,
} from 'date-fns'
import { useToast } from '@/components/ToastProvider'
import { getServiceIcon } from '@/lib/serviceIcons'
import { useTranslation, DictionaryKeys } from '@/lib/i18n'
import {
  ChevronLeft, ChevronRight, Plus, Search, X, Check, Clock,
  MapPin, Phone, User, Trash2, CalendarDays, Building2, Wallet,
} from 'lucide-react'

type HotelRef = { _id: string; name?: string; shortName?: string }
interface Service { _id: string; name: string; color: string; isActive: boolean; hotelId?: string | HotelRef }
interface Hotel { _id: string; name: string; shortName: string }
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
  paid: boolean
  finished: boolean
}

type ViewMode = 'day' | 'week' | 'month'
type StatusFilter = 'all' | 'unpaid' | 'paid' | 'finished'

const svcId = (b: Booking) => (typeof b.serviceId === 'string' ? b.serviceId : b.serviceId?._id)
const extractHotelId = (h?: string | HotelRef) => (!h ? '' : typeof h === 'string' ? h : h._id || '')
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const fromMin = (min: number) => `${Math.floor(min / 60).toString().padStart(2, '0')}:${(min % 60).toString().padStart(2, '0')}`
const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

// Derived lifecycle state of a booking, driven by payment + completion.
type StateKey = 'finished' | 'free' | 'paid' | 'unpaid'
function bookingState(b: Booking): { key: StateKey; labelKey: DictionaryKeys; color: string; badge: string } {
  if (b.finished) return { key: 'finished', labelKey: 'finished', color: '#10b981', badge: 'badge-success' }
  if ((b.totalPrice || 0) === 0) return { key: 'free', labelKey: 'free', color: '#3b82f6', badge: 'badge-blue' }
  if (b.paid) return { key: 'paid', labelKey: 'paid', color: '#10b981', badge: 'badge-success' }
  return { key: 'unpaid', labelKey: 'unpaid', color: '#f59e0b', badge: 'badge-warning' }
}
// A booking may be completed once it's paid or free.
const canFinish = (b: Booking) => !b.finished && (b.paid || (b.totalPrice || 0) === 0)

const ROW_HEIGHTS = { Compact: 48, Cozy: 64, Roomy: 88 } as const
type Density = keyof typeof ROW_HEIGHTS
const DENSITY_LABEL: Record<Density, string> = { Compact: 'S', Cozy: 'M', Roomy: 'L' }
const DENSITY_KEY: Record<Density, DictionaryKeys> = { Compact: 'compact', Cozy: 'cozy', Roomy: 'roomy' }

export default function CalendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { t } = useTranslation()

  const [today, setToday] = useState(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = searchParams.get('date')
    return d ? parseISO(d) : new Date()
  })
  const [view, setView] = useState<ViewMode>('week')
  const [density, setDensity] = useState<Density>('Cozy')
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
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

  // Load services + hotels (default: everything selected)
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then((data: Service[]) => {
        const active = Array.isArray(data) ? data.filter(s => s.isActive) : []
        setServices(active)
        setSelectedServices(new Set(active.map(s => s._id)))
      })
    fetch('/api/hotels')
      .then(r => r.json())
      .then((data: Hotel[]) => {
        const list = Array.isArray(data) ? data : []
        setHotels(list)
        setSelectedHotels(new Set(list.map(h => h._id)))
      })
  }, [])

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

  // Apply all filters
  const visibleBookings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter(b => {
      if (!b.serviceId) return false
      if (b.status === 'cancelled') return false
      if (!selectedServices.has(svcId(b))) return false
      const hid = serviceHotel.get(svcId(b)) || ''
      if (hid && !selectedHotels.has(hid)) return false
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
  }, [bookings, selectedServices, selectedHotels, serviceHotel, statusFilter, search])

  const bookingsForDay = useCallback(
    (dateStr: string) => visibleBookings.filter(b => b.date === dateStr),
    [visibleBookings],
  )

  // Summary of the visible range
  const summary = useMemo(() => {
    const count = visibleBookings.length
    const revenue = visibleBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const collected = visibleBookings
      .filter(b => b.paid || (b.totalPrice || 0) === 0)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    return { count, revenue, collected }
  }, [visibleBookings])

  // Optimistically patch a booking locally after a mutation.
  function patchLocal(id: string, changes: Partial<Booking>) {
    setBookings(prev => prev.map(b => (b._id === id ? { ...b, ...changes } : b)))
    setSelectedBooking(prev => (prev && prev._id === id ? { ...prev, ...changes } : prev))
  }

  async function updateBooking(id: string, changes: Partial<Booking>, successMsg: string) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    if (res.ok) {
      patchLocal(id, changes)
      showToast(successMsg, 'success')
    } else {
      showToast(t('updateFailed'), 'error')
    }
  }

  const markPaid = (b: Booking) => updateBooking(b._id, { paid: true }, t('markedAsPaid'))
  const markFinished = (b: Booking) => updateBooking(b._id, { finished: true }, t('bookingCompleted'))

  async function handleDeleteBooking(id: string) {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t('bookingDeleted'), 'success')
      setSelectedBooking(null)
      setDeleteConfirm(null)
      loadBookings()
    } else {
      showToast(t('deleteFailed'), 'error')
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
            <button className="cal-icon-btn" onClick={() => navigate(-1)} aria-label={t('previous')}><ChevronLeft size={16} /></button>
            <button className="cal-pill" onClick={() => setCurrentDate(new Date())} style={{ minWidth: 52, justifyContent: 'center' }}>{t('today')}</button>
            <button className="cal-icon-btn" onClick={() => navigate(1)} aria-label={t('next')}><ChevronRight size={16} /></button>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '1.0625rem', letterSpacing: '-0.01em' }}>{headerLabel}</span>

          <div className="cal-seg" style={{ marginLeft: 'auto' }}>
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
                {v === 'day' ? t('day') : v === 'week' ? t('periodWeek') : t('periodMonth')}
              </button>
            ))}
          </div>

          {view !== 'month' && (
            <div className="cal-seg">
              {(Object.keys(ROW_HEIGHTS) as Density[]).map(d => (
                <button key={d} className={density === d ? 'active' : ''} onClick={() => setDensity(d)} title={`${t(DENSITY_KEY[d])} ${t('rowsWord')}`}>{DENSITY_LABEL[d]}</button>
              ))}
            </div>
          )}

          <button className="btn btn-primary btn-sm" onClick={() => goToCreate(format(currentDate, 'yyyy-MM-dd'))}>
            <Plus size={14} strokeWidth={2.5} /> {t('newShort')}
          </button>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: '0.82rem' }}
              placeholder={t('searchGuestRoomPhone')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 2 }} aria-label={t('clear')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            {([
              { key: 'all', labelKey: 'all', dot: '' },
              { key: 'unpaid', labelKey: 'unpaid', dot: '#f59e0b' },
              { key: 'paid', labelKey: 'paid', dot: '#10b981' },
              { key: 'finished', labelKey: 'finished', dot: '#6366f1' },
            ] as { key: StatusFilter; labelKey: DictionaryKeys; dot: string }[]).map(s => (
              <button key={s.key} className={`cal-pill ${statusFilter === s.key ? 'active' : ''}`} onClick={() => setStatusFilter(s.key)}>
                {s.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusFilter === s.key ? '#fff' : s.dot }} />}
                {t(s.labelKey)}
              </button>
            ))}
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
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{t('bookings')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-600)', lineHeight: 1 }}>{money(summary.revenue)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{t('sum')} · {view === 'day' ? t('day') : view === 'week' ? t('periodWeek') : t('periodMonth')}</div>
            </div>
          </div>
          {summary.revenue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--gray-500)', borderTop: '1px dashed var(--gray-200)', paddingTop: 8 }}>
              <Wallet size={13} style={{ color: '#10b981' }} />
              <span style={{ fontWeight: 700, color: '#059669' }}>{money(summary.collected)}</span> {t('collected')}
              {summary.collected < summary.revenue && (
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#d97706' }}>{money(summary.revenue - summary.collected)} {t('due')}</span>
              )}
            </div>
          )}
        </div>

        {/* Hotel filter */}
        {hotels.length > 0 && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.8125rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} style={{ color: 'var(--gray-400)' }} /> {t('hotels')}
              </h3>
              <button
                onClick={() => setSelectedHotels(allHotelsSelected ? new Set() : new Set(hotels.map(h => h._id)))}
                style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {allHotelsSelected ? t('clear') : t('all')}
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
            <h3 style={{ fontSize: '0.8125rem', margin: 0 }}>{t('services')}</h3>
            <button
              onClick={() => setSelectedServices(allSelected ? new Set() : new Set(services.map(s => s._id)))}
              style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {allSelected ? t('clear') : t('all')}
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
            {services.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{t('noServicesYet')}</p>}
          </div>
        </div>
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>{t('bookingDetails')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }} aria-label={t('close')}><X size={18} /></button>
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
                      {t(st.labelKey)}
                    </span>
                  )
                })()}
              </div>

              <DetailRow icon={<User size={15} />} label={t('guest')} value={selectedBooking.customerName} />
              {selectedBooking.roomNumber && <DetailRow icon={<MapPin size={15} />} label={t('room')} value={`🏨 ${selectedBooking.roomNumber}`} accent />}
              {selectedBooking.customerPhone && <DetailRow icon={<Phone size={15} />} label={t('phone')} value={selectedBooking.customerPhone} />}
              <DetailRow icon={<CalendarDays size={15} />} label={t('date')} value={format(parseISO(selectedBooking.date), 'EEEE, MMM d, yyyy')} />
              <DetailRow icon={<Clock size={15} />} label={t('time')} value={`${selectedBooking.startTime} – ${selectedBooking.endTime}`} />
              {selectedBooking.totalPrice > 0 && (
                <DetailRow icon={<span style={{ fontWeight: 700, fontSize: 11 }}>{t('sum')}</span>} label={t('price')} value={`${money(selectedBooking.totalPrice)} ${t('sum')}`} success />
              )}
              <DetailRow
                icon={<Wallet size={15} />}
                label={t('payment')}
                value={selectedBooking.totalPrice === 0 ? t('freeNoCharge') : selectedBooking.paid ? t('paid') : t('unpaid')}
                accent={!selectedBooking.paid && selectedBooking.totalPrice > 0}
                success={selectedBooking.paid}
              />
              {selectedBooking.notes && <DetailRow icon={<span style={{ fontSize: 14 }}>📝</span>} label={t('notes')} value={selectedBooking.notes} />}
            </div>

            <div className="divider" />

            {/* Lifecycle actions */}
            {selectedBooking.finished ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.6rem', marginBottom: '0.85rem', borderRadius: 10, background: '#10b98114', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
                <Check size={16} /> {t('completed')}
              </div>
            ) : bookingState(selectedBooking).key === 'unpaid' ? (
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.85rem' }} onClick={() => setPayConfirm(selectedBooking)}>
                <Wallet size={15} /> {t('markAsPaid')}
              </button>
            ) : (
              <button
                className="btn"
                style={{ width: '100%', marginBottom: '0.85rem', background: '#10b981', color: '#fff', border: 'none' }}
                onClick={() => markFinished(selectedBooking)}
              >
                <Check size={16} strokeWidth={2.5} /> {t('markAsFinished')}
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {deleteConfirm === selectedBooking._id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{t('deleteThisBooking')}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBooking(selectedBooking._id)}>{t('delete')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                </div>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(selectedBooking._id)}>
                  <Trash2 size={13} /> {t('delete')}
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedBooking(null); setDeleteConfirm(null) }}>{t('close')}</button>
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
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('confirmPayment')}</h2>
              <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {t('didYouReceive', { amount: `${money(payConfirm.totalPrice)} ${t('sum')}`, name: payConfirm.customerName })}
              </p>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPayConfirm(null)}>{t('back')}</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={async () => { await markPaid(payConfirm); setPayConfirm(null) }}
              >
                <Check size={15} strokeWidth={2.5} /> {t('yesReceived')}
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

/* ──────────────── Time-grid layout ──────────────── */

interface Placed { b: Booking; start: number; end: number; col: number; cols: number }

// Pack overlapping events into side-by-side columns per day.
function packDay(events: Booking[]): Placed[] {
  const items = events
    .map(b => ({ b, start: toMin(b.startTime), end: Math.max(toMin(b.endTime), toMin(b.startTime) + 15) }))
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const out: Placed[] = []
  let cluster: Placed[] = []
  let active: { end: number; col: number }[] = []
  let clusterEnd = -1

  const flush = () => {
    const cols = cluster.reduce((m, x) => Math.max(m, x.col), 0) + 1
    cluster.forEach(x => (x.cols = cols))
    out.push(...cluster)
    cluster = []
    active = []
  }

  for (const it of items) {
    if (cluster.length && it.start >= clusterEnd) flush()
    const overlapping = active.filter(a => a.end > it.start)
    const used = new Set(overlapping.map(a => a.col))
    let col = 0
    while (used.has(col)) col++
    const placed: Placed = { b: it.b, start: it.start, end: it.end, col, cols: 1 }
    cluster.push(placed)
    active.push({ end: it.end, col })
    clusterEnd = Math.max(clusterEnd, it.end)
  }
  if (cluster.length) flush()
  return out
}

function TimeGrid({ days, today, rowH, bookingsForDay, onCreate, onBookingClick, onFinish, onDayHeaderClick }: {
  days: Date[]
  today: Date
  rowH: number
  bookingsForDay: (d: string) => Booking[]
  onCreate: (dateStr: string, time: string) => void
  onBookingClick: (b: Booking) => void
  onFinish: (b: Booking) => void
  onDayHeaderClick?: (d: Date) => void
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const ppm = rowH / 60

  // Dynamic visible range: default 07:00–22:00, expanded to fit any booking.
  const { startHour, endHour } = useMemo(() => {
    let minM = 7 * 60, maxM = 22 * 60
    for (const day of days) {
      for (const b of bookingsForDay(format(day, 'yyyy-MM-dd'))) {
        minM = Math.min(minM, toMin(b.startTime))
        maxM = Math.max(maxM, toMin(b.endTime))
      }
    }
    return { startHour: Math.max(0, Math.floor(minM / 60)), endHour: Math.min(24, Math.ceil(maxM / 60)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, bookingsForDay, rowH])

  const startMin = startHour * 60
  const totalMin = (endHour - startHour) * 60
  const bodyHeight = totalMin * ppm
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const GUTTER = 58

  const nowMin = today.getHours() * 60 + today.getMinutes()
  const nowVisible = nowMin >= startMin && nowMin <= endHour * 60
  const todayInRange = days.some(d => isSameDay(d, today))

  // On mount, scroll to the current time (centered) when today is in view,
  // otherwise to a sensible business-hours start.
  useEffect(() => {
    const scroller = bodyRef.current?.parentElement
    if (!scroller) return
    const anchorMin = todayInRange && nowVisible ? nowMin : 8 * 60
    const target = Math.max(0, (anchorMin - startMin) * ppm - scroller.clientHeight / 2 + 40)
    scroller.scrollTo({ top: target })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let minute = startMin + Math.round((y / ppm) / 15) * 15
    minute = Math.max(startMin, Math.min(endHour * 60 - 15, minute))
    onCreate(format(day, 'yyyy-MM-dd'), fromMin(minute))
  }

  return (
    <div style={{ minWidth: days.length > 1 ? 640 : undefined }}>
      {/* Sticky header */}
      <div style={{
        display: 'flex', paddingLeft: GUTTER, position: 'sticky', top: 0, zIndex: 6,
        background: 'var(--surface-card)', borderBottom: '1px solid var(--gray-200)',
      }}>
        {days.map(day => {
          const isToday = isSameDay(day, today)
          const isWeekend = [0, 6].includes(day.getDay())
          const clickable = !!onDayHeaderClick
          return (
            <div
              key={day.toISOString()}
              onClick={clickable ? () => onDayHeaderClick!(day) : undefined}
              style={{
                flex: 1, textAlign: 'center', padding: '9px 4px 8px',
                borderLeft: '1px solid var(--gray-100)', cursor: clickable ? 'pointer' : 'default',
                background: isToday ? 'var(--brand-50)' : 'transparent',
                borderBottom: isToday ? '2px solid var(--brand-500)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <div style={{
                fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700,
                color: isToday ? 'var(--brand-600)' : isWeekend ? 'var(--gray-300)' : 'var(--gray-400)',
              }}>
                {format(day, 'EEE')}
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', margin: '3px auto 0',
                background: isToday ? 'var(--brand-500)' : 'transparent',
                boxShadow: isToday ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9375rem', fontWeight: isToday ? 700 : 600,
                color: isToday ? '#fff' : isWeekend ? 'var(--gray-400)' : 'var(--gray-700)',
              }}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{ position: 'relative', height: bodyHeight }}>
        {/* Hour lines + gutter labels */}
        {hours.map(h => {
          const top = (h * 60 - startMin) * ppm
          return (
            <div key={h}>
              <div style={{ position: 'absolute', top, left: GUTTER, right: 0, borderTop: '1px solid var(--gray-100)' }} />
              <div style={{
                position: 'absolute', top, left: 0, width: GUTTER - 10, textAlign: 'right',
                transform: 'translateY(-50%)', fontSize: '0.68rem', color: 'var(--gray-400)',
                fontVariantNumeric: 'tabular-nums', background: 'var(--surface-card)', paddingRight: 2,
              }}>
                {h < 24 ? `${h.toString().padStart(2, '0')}:00` : ''}
              </div>
            </div>
          )
        })}
        {/* Half-hour faint lines */}
        {hours.slice(0, -1).map(h => (
          <div key={`half-${h}`} style={{ position: 'absolute', top: (h * 60 + 30 - startMin) * ppm, left: GUTTER, right: 0, borderTop: '1px dashed var(--gray-100)', opacity: 0.5 }} />
        ))}

        {/* Day columns */}
        <div style={{ position: 'absolute', left: GUTTER, right: 0, top: 0, bottom: 0, display: 'flex' }}>
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const placed = packDay(bookingsForDay(dateStr))
            const isToday = isSameDay(day, today)
            const isWeekend = [0, 6].includes(day.getDay())
            return (
              <div
                key={day.toISOString()}
                onClick={e => handleColumnClick(e, day)}
                style={{
                  flex: 1, position: 'relative', borderLeft: '1px solid var(--gray-100)',
                  cursor: 'pointer',
                  background: isToday ? 'rgba(99,102,241,0.055)' : isWeekend ? 'rgba(148,163,184,0.04)' : 'transparent',
                }}
              >
                {placed.map(p => (
                  <EventBlock key={p.b._id} placed={p} startMin={startMin} ppm={ppm} onClick={onBookingClick} onFinish={onFinish} />
                ))}
                {isToday && nowVisible && (
                  <div style={{ position: 'absolute', top: (nowMin - startMin) * ppm, left: 0, right: 0, zIndex: 9, pointerEvents: 'none' }}>
                    <div style={{
                      position: 'absolute', left: -5, top: -5, width: 11, height: 11, borderRadius: '50%',
                      background: 'var(--brand-500)', border: '2px solid #fff', boxShadow: '0 0 0 1px var(--brand-500)',
                    }} />
                    <div style={{ borderTop: '2px solid var(--brand-500)', boxShadow: '0 0 6px rgba(99,102,241,0.35)' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Current-time label in the gutter (Teams-style) */}
        {todayInRange && nowVisible && (
          <div style={{
            position: 'absolute', top: (nowMin - startMin) * ppm, left: 0, width: GUTTER - 6,
            transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none',
            display: 'flex', justifyContent: 'flex-end',
          }}>
            <span style={{
              background: 'var(--brand-500)', color: '#fff', fontSize: '0.66rem', fontWeight: 700,
              padding: '1px 6px', borderRadius: 6, fontVariantNumeric: 'tabular-nums',
              boxShadow: '0 2px 6px rgba(99,102,241,0.4)', letterSpacing: '0.01em',
            }}>
              {fromMin(nowMin)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function EventBlock({ placed, startMin, ppm, onClick, onFinish }: { placed: Placed; startMin: number; ppm: number; onClick: (b: Booking) => void; onFinish: (b: Booking) => void }) {
  const { t } = useTranslation()
  const { b } = placed
  const color = b.serviceId?.color || '#6366f1'
  const top = (placed.start - startMin) * ppm
  const height = Math.max((placed.end - placed.start) * ppm, 20)
  const widthPct = 100 / placed.cols
  const state = bookingState(b)
  const finished = b.finished
  const unpaid = state.key === 'unpaid'
  const label = b.roomNumber ? `🏨 ${b.roomNumber}` : b.customerName

  return (
    <div
      className="cal-event"
      title={`${b.startTime}–${b.endTime} · ${b.customerName}${b.roomNumber ? ` · ${t('room')} ${b.roomNumber}` : ''} · ${b.serviceId?.name || ''} · ${t(state.labelKey)}`}
      onClick={e => { e.stopPropagation(); onClick(b) }}
      style={{
        top, height,
        left: `calc(${placed.col * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: finished ? `${color}18` : `${color}26`,
        border: `1px ${unpaid ? 'dashed' : 'solid'} ${color}66`,
        borderLeft: `3px solid ${finished ? '#10b981' : color}`,
        padding: height > 34 ? '3px 6px' : '1px 6px',
      }}
    >
      {/* Corner status marker / finish button */}
      <span style={{ position: 'absolute', top: 3, right: 3, zIndex: 2 }}>
        {finished ? (
          <span title={t('completed')} style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={11} strokeWidth={3} />
          </span>
        ) : canFinish(b) ? (
          <button
            title={t('markFinishedTitle')}
            aria-label={t('markFinishedTitle')}
            onClick={e => { e.stopPropagation(); onFinish(b) }}
            style={{
              width: 16, height: 16, borderRadius: '50%', padding: 0, cursor: 'pointer',
              background: '#fff', border: '1.5px solid #10b981', color: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s',
            }}
            onMouseEnter={e => { const t = e.currentTarget; t.style.background = '#10b981'; t.style.color = '#fff' }}
            onMouseLeave={e => { const t = e.currentTarget; t.style.background = '#fff'; t.style.color = '#10b981' }}
          >
            <Check size={11} strokeWidth={3} />
          </button>
        ) : (
          <span title={t('unpaid')} style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', display: 'block', boxShadow: '0 0 0 2px #fff' }} />
        )}
      </span>

      <div style={{
        fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-800)', paddingRight: 16,
        lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      {height > 30 && (
        <div style={{ fontSize: '0.64rem', color: 'var(--gray-600)', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {b.startTime}–{b.endTime}
        </div>
      )}
      {height > 52 && b.roomNumber && (
        <div style={{ fontSize: '0.64rem', color: 'var(--gray-500)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{b.customerName}</div>
      )}
      {height > 68 && (
        <div style={{ fontSize: '0.62rem', color, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 1 }}>{b.serviceId?.name}</div>
      )}
    </div>
  )
}

/* ──────────────── Month view ──────────────── */

function MonthView({ currentDate, today, bookingsForDay, onDayClick, onBookingClick, onFinish }: {
  currentDate: Date
  today: Date
  bookingsForDay: (d: string) => Booking[]
  onDayClick: (d: Date) => void
  onBookingClick: (b: Booking) => void
  onFinish: (b: Booking) => void
}) {
  const { t } = useTranslation()
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const end = addDays(startOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 6)
  const days = eachDayOfInterval({ start, end })
  const dayNames: DictionaryKeys[] = ['dowMon', 'dowTue', 'dowWed', 'dowThu', 'dowFri', 'dowSat', 'dowSun']

  return (
    <div style={{ padding: '0.85rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gray-400)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t(d)}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const list = bookingsForDay(dateStr).filter(b => b.status !== 'cancelled')
            .sort((a, b) => toMin(a.startTime) - toMin(b.startTime))
          const isToday = isSameDay(day, today)
          const inMonth = isSameMonth(day, currentDate)
          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(day)}
              style={{
                minHeight: 104, padding: 6, borderRadius: 10,
                background: isToday ? 'var(--brand-50)' : inMonth ? 'var(--surface-card)' : 'var(--gray-50)',
                border: `1px solid ${isToday ? 'var(--brand-400)' : 'var(--gray-200)'}`,
                cursor: 'pointer', transition: 'border-color .12s, box-shadow .12s',
                display: 'flex', flexDirection: 'column', gap: 3,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-400)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = isToday ? 'var(--brand-400)' : 'var(--gray-200)' }}
            >
              <div style={{
                fontSize: '0.75rem', fontWeight: isToday ? 700 : 600,
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', alignSelf: 'flex-start',
                background: isToday ? 'var(--brand-500)' : 'transparent',
                color: isToday ? '#fff' : inMonth ? 'var(--gray-700)' : 'var(--gray-300)',
              }}>
                {format(day, 'd')}
              </div>
              {list.slice(0, 3).map(b => {
                const color = b.serviceId?.color || '#6366f1'
                return (
                  <div
                    key={b._id}
                    onClick={e => { e.stopPropagation(); onBookingClick(b) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: b.finished ? `${color}12` : `${color}1f`, borderLeft: `3px solid ${b.finished ? '#10b981' : color}`,
                      borderRadius: 5, padding: '2px 5px 2px 6px', fontSize: '0.68rem',
                      color: 'var(--gray-700)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{b.startTime}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.roomNumber ? `🏨 ${b.roomNumber}` : b.customerName}</span>
                    {b.finished ? (
                      <Check size={11} strokeWidth={3} style={{ color: '#10b981', flexShrink: 0 }} />
                    ) : canFinish(b) ? (
                      <button
                        title={t('markFinishedTitle')} aria-label={t('markFinishedTitle')}
                        onClick={e => { e.stopPropagation(); onFinish(b) }}
                        style={{ width: 14, height: 14, flexShrink: 0, borderRadius: '50%', padding: 0, cursor: 'pointer', background: '#fff', border: '1.5px solid #10b981', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={9} strokeWidth={3} />
                      </button>
                    ) : (
                      <span title={t('unpaid')} style={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', background: '#f59e0b' }} />
                    )}
                  </div>
                )
              })}
              {list.length > 3 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', paddingLeft: 4, fontWeight: 600 }}>{t('plusMore', { count: list.length - 3 })}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
