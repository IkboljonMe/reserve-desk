'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, eachWeekOfInterval, addDays, subDays, differenceInCalendarDays, formatDistanceToNow,
} from 'date-fns'
import { nowUZ } from '@/lib/timezone'
import { getServiceIcon } from '@/lib/serviceIcons'
import { useToast } from '@/components/ToastProvider'
import {
  Search, X, Check, Wallet, Building2, Users, BedDouble, SlidersHorizontal,
  Plus, Pencil, Trash2, RotateCcw, Clock, CalendarDays, Phone, User, ArrowUpDown, ExternalLink,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────
type HotelRef = { _id: string; name?: string; shortName?: string }
interface Service { _id: string; name: string; color: string; isActive: boolean; hotelId?: string | HotelRef }
interface Hotel { _id: string; name: string; shortName: string }
interface Actor { _id?: string; name?: string; email?: string }
interface BookingEvent { action: string; at: string; by?: Actor | string; detail?: string }
interface Booking {
  _id: string
  serviceId: { _id: string; name: string; color: string }
  customerName: string
  customerPhone: string
  roomNumber: string
  date: string
  startTime: string
  endTime: string
  duration: number
  notes: string
  status: string
  totalPrice: number
  paid: boolean
  finished: boolean
  bookingType?: 'client' | 'room' | 'custom'
  category?: string
  paidAt?: string | null
  finishedAt?: string | null
  createdAt?: string
  updatedAt?: string
  createdBy?: Actor | string
  history?: BookingEvent[]
}

type PaymentFilter = 'all' | 'paid' | 'unpaid' | 'free'
type TypeFilter = 'all' | 'client' | 'room' | 'custom'
type StateFilter = 'all' | 'active' | 'finished'
type PeriodKey = 'week' | 'month' | '7d' | '30d' | 'custom'

// ── Helpers ─────────────────────────────────────────────────────────────────
const svcId = (b: Booking) => (typeof b.serviceId === 'string' ? b.serviceId : b.serviceId?._id)
const extractHotelId = (h?: string | HotelRef) => (!h ? '' : typeof h === 'string' ? h : h._id || '')
const money = (v: number) => Math.round(v).toLocaleString('en-US').replace(/,/g, ' ')
const actorName = (a?: Actor | string) => (!a || typeof a === 'string' ? 'Admin' : a.name || a.email || 'Admin')

const INK_COLLECTED = '#059669'   // darker green for ink/stroke (contrast relief)
const FILL_COLLECTED = '#10b981'  // green fill
const EXPECTED = '#6366f1'        // indigo (brand)

function bookingState(b: Booking): { key: 'finished' | 'free' | 'paid' | 'unpaid'; label: string; color: string; bg: string } {
  if (b.finished) return { key: 'finished', label: 'Finished', color: '#4f46e5', bg: '#eef2ff' }
  if ((b.totalPrice || 0) === 0) return { key: 'free', label: 'Free', color: '#2563eb', bg: '#eff6ff' }
  if (b.paid) return { key: 'paid', label: 'Paid', color: INK_COLLECTED, bg: '#ecfdf5' }
  return { key: 'unpaid', label: 'Unpaid', color: '#b45309', bg: '#fffbeb' }
}
const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  client: { label: 'Client', icon: <Users size={12} />, color: '#3b82f6' },
  room: { label: 'Room', icon: <BedDouble size={12} />, color: '#10b981' },
  custom: { label: 'Custom', icon: <SlidersHorizontal size={12} />, color: '#f59e0b' },
}

// Animated count-up for headline figures.
function useCountUp(target: number, duration = 750) {
  const [val, setVal] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const from = fromRef.current
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

// ── Period ──────────────────────────────────────────────────────────────────
function periodRange(key: PeriodKey, customFrom: string, customTo: string): { from: string; to: string } {
  const now = nowUZ()
  const f = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (key) {
    case 'week': return { from: f(startOfWeek(now, { weekStartsOn: 1 })), to: f(endOfWeek(now, { weekStartsOn: 1 })) }
    case 'month': return { from: f(startOfMonth(now)), to: f(endOfMonth(now)) }
    case '7d': return { from: f(subDays(now, 6)), to: f(now) }
    case '30d': return { from: f(subDays(now, 29)), to: f(now) }
    case 'custom': return { from: customFrom, to: customTo }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Period
  const [period, setPeriod] = useState<PeriodKey>('month')
  const [customFrom, setCustomFrom] = useState(format(subDays(nowUZ(), 29), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(nowUZ(), 'yyyy-MM-dd'))
  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo])

  // Explorer filters
  const [search, setSearch] = useState('')
  const [fHotels, setFHotels] = useState<Set<string>>(new Set())
  const [fServices, setFServices] = useState<Set<string>>(new Set())
  const [fPayment, setFPayment] = useState<PaymentFilter>('all')
  const [fType, setFType] = useState<TypeFilter>('all')
  const [fState, setFState] = useState<StateFilter>('all')
  const [sortKey, setSortKey] = useState<'date' | 'price' | 'created'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Detail drawer
  const [detailId, setDetailId] = useState<string | null>(null)

  const serviceHotel = useMemo(() => {
    const m = new Map<string, string>()
    services.forEach(s => m.set(s._id, extractHotelId(s.hotelId)))
    return m
  }, [services])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sv, ht, bk] = await Promise.all([
        fetch('/api/services').then(r => r.json()),
        fetch('/api/hotels').then(r => r.json()),
        fetch(`/api/bookings?dateFrom=${range.from}&dateTo=${range.to}`).then(r => r.json()),
      ])
      setServices(Array.isArray(sv) ? sv.filter((s: Service) => s.isActive) : [])
      setHotels(Array.isArray(ht) ? ht : [])
      setBookings(Array.isArray(bk) ? bk.filter((b: Booking) => b.status !== 'cancelled') : [])
    } catch {
      showToast('Failed to load dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to, showToast])

  useEffect(() => { load() }, [load])

  // Optimistic local patch after a mutation.
  const patchLocal = useCallback((id: string, changes: Partial<Booking>) => {
    setBookings(prev => prev.map(b => (b._id === id ? { ...b, ...changes } : b)))
  }, [])

  // ── Filtered + sorted rows ──────────────────────────────────────────────────
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = bookings.filter(b => {
      if (!b.serviceId) return false
      if (fServices.size && !fServices.has(svcId(b))) return false
      const hid = serviceHotel.get(svcId(b)) || ''
      if (fHotels.size && !(hid && fHotels.has(hid))) return false
      const st = bookingState(b).key
      if (fPayment === 'paid' && st !== 'paid') return false
      if (fPayment === 'unpaid' && st !== 'unpaid') return false
      if (fPayment === 'free' && st !== 'free') return false
      if (fType !== 'all' && (b.bookingType || 'custom') !== fType) return false
      if (fState === 'active' && b.finished) return false
      if (fState === 'finished' && !b.finished) return false
      if (q && !`${b.customerName} ${b.roomNumber} ${b.customerPhone}`.toLowerCase().includes(q)) return false
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      if (sortKey === 'price') return (a.totalPrice - b.totalPrice) * dir
      if (sortKey === 'created') return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dir
      const ad = `${a.date} ${a.startTime}`, bd = `${b.date} ${b.startTime}`
      return ad < bd ? -dir : ad > bd ? dir : 0
    })
  }, [bookings, search, fServices, fHotels, fPayment, fType, fState, serviceHotel, sortKey, sortDir])

  // ── Analytics: bucketed income ──────────────────────────────────────────────
  const analytics = useMemo(() => {
    const from = parseISO(range.from), to = parseISO(range.to)
    const span = Math.max(0, differenceInCalendarDays(to, from))
    const byWeek = span > 34
    const buckets = byWeek
      ? eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).map(s => ({ start: s, end: addDays(s, 6) }))
      : eachDayOfInterval({ start: from, end: to }).map(d => ({ start: d, end: d }))

    const data = buckets.map(bk => {
      const s = format(bk.start, 'yyyy-MM-dd'), e = format(bk.end, 'yyyy-MM-dd')
      const inBucket = bookings.filter(b => b.date >= s && b.date <= e)
      const expected = inBucket.reduce((t, b) => t + (b.totalPrice || 0), 0)
      const collected = inBucket.filter(b => b.paid).reduce((t, b) => t + (b.totalPrice || 0), 0)
      return {
        label: byWeek ? format(bk.start, 'MMM d') : format(bk.start, span <= 8 ? 'EEE d' : 'MMM d'),
        expected, collected, count: inBucket.length,
      }
    })

    const total = bookings.reduce((t, b) => t + (b.totalPrice || 0), 0)
    const collected = bookings.filter(b => b.paid).reduce((t, b) => t + (b.totalPrice || 0), 0)
    return { data, byWeek, total, collected, due: total - collected, count: bookings.length }
  }, [bookings, range.from, range.to])

  // Income per service (breakdown)
  const perService = useMemo(() => {
    const map = new Map<string, number>()
    bookings.forEach(b => map.set(svcId(b), (map.get(svcId(b)) || 0) + (b.totalPrice || 0)))
    return services
      .map(s => ({ svc: s, total: map.get(s._id) || 0 }))
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [bookings, services])

  const allHotelsOn = fHotels.size === 0
  const allServicesOn = fServices.size === 0
  const activeFilterCount = (fHotels.size ? 1 : 0) + (fServices.size ? 1 : 0) + (fPayment !== 'all' ? 1 : 0) + (fType !== 'all' ? 1 : 0) + (fState !== 'all' ? 1 : 0) + (search ? 1 : 0)

  function toggleSort(key: 'date' | 'price' | 'created') {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <style>{`
        @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes barIn { from { height: 0; } }
        .dash-pill { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:999px;
          font-size:0.78rem; font-weight:600; cursor:pointer; border:1.5px solid var(--gray-200);
          background:var(--surface-card); color:var(--gray-600); transition:all .15s; font-family:inherit; white-space:nowrap; }
        .dash-pill:hover { border-color:var(--brand-400); color:var(--brand-700); }
        .dash-pill.active { background:var(--brand-500); color:#fff; border-color:transparent; }
        .dash-seg { display:inline-flex; background:var(--gray-100); border-radius:10px; padding:3px; gap:2px; }
        .dash-seg button { border:none; background:transparent; padding:5px 12px; border-radius:7px; font-size:0.8rem;
          font-weight:600; color:var(--gray-500); cursor:pointer; transition:all .15s; font-family:inherit; text-transform:capitalize; }
        .dash-seg button.active { background:#fff; color:var(--brand-700); box-shadow:var(--shadow-xs); }
        .dash-th { padding:9px 12px; text-align:left; font-weight:700; color:var(--gray-500); font-size:0.7rem;
          text-transform:uppercase; letter-spacing:0.04em; white-space:nowrap; user-select:none; }
        .dash-row:hover { background:var(--brand-50) !important; }
        .bar-col:hover .bar-exp { filter:brightness(0.97); }
      `}</style>

      {/* Header + period */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ marginTop: 4 }}>{format(nowUZ(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="dash-seg">
            {([['week', 'Week'], ['month', 'Month'], ['7d', '7d'], ['30d', '30d'], ['custom', 'Custom']] as [PeriodKey, string][]).map(([k, l]) => (
              <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{l}</button>
            ))}
          </div>
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" className="form-input" style={{ padding: '5px 8px', fontSize: '0.8rem' }} value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} />
              <span style={{ color: 'var(--gray-400)' }}>–</span>
              <input type="date" className="form-input" style={{ padding: '5px 8px', fontSize: '0.8rem' }} value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)} />
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => router.push(`/book?date=${format(nowUZ(), 'yyyy-MM-dd')}`)}>
            <Plus size={14} strokeWidth={2.5} /> New Booking
          </button>
        </div>
      </div>

      {/* Zone A — Income analytics */}
      <div className="card" style={{ padding: '1.25rem 1.4rem' }}>
        <IncomeAnalytics analytics={analytics} loading={loading} perService={perService} />
      </div>

      {/* Zone B — Bookings explorer */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filter toolbar */}
        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '0.95rem', margin: 0, marginRight: 4 }}>Bookings</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>{rows.length} in range</span>
            <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
              <input className="form-input" style={{ paddingLeft: 32, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem' }}
                placeholder="Search guest, room or phone…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }} aria-label="Clear"><X size={14} /></button>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Hotels */}
            {hotels.length > 1 && (
              <FilterGroup icon={<Building2 size={12} />} label="Hotel">
                <button className={`dash-pill ${allHotelsOn ? 'active' : ''}`} onClick={() => setFHotels(new Set())}>All</button>
                {hotels.map(h => (
                  <button key={h._id} className={`dash-pill ${fHotels.has(h._id) ? 'active' : ''}`}
                    onClick={() => setFHotels(prev => { const n = new Set(prev); if (n.has(h._id)) n.delete(h._id); else n.add(h._id); return n })}>{h.shortName}</button>
                ))}
              </FilterGroup>
            )}
            {/* Payment */}
            <FilterGroup icon={<Wallet size={12} />} label="Payment">
              {(['all', 'paid', 'unpaid', 'free'] as PaymentFilter[]).map(p => (
                <button key={p} className={`dash-pill ${fPayment === p ? 'active' : ''}`} onClick={() => setFPayment(p)}>{p === 'all' ? 'All' : p[0].toUpperCase() + p.slice(1)}</button>
              ))}
            </FilterGroup>
            {/* Type */}
            <FilterGroup label="Type">
              {(['all', 'client', 'room', 'custom'] as TypeFilter[]).map(tp => (
                <button key={tp} className={`dash-pill ${fType === tp ? 'active' : ''}`} onClick={() => setFType(tp)}>{tp === 'all' ? 'All' : TYPE_META[tp].label}</button>
              ))}
            </FilterGroup>
            {/* State */}
            <FilterGroup label="State">
              {(['all', 'active', 'finished'] as StateFilter[]).map(s => (
                <button key={s} className={`dash-pill ${fState === s ? 'active' : ''}`} onClick={() => setFState(s)}>{s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}</button>
              ))}
            </FilterGroup>
            {activeFilterCount > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}
                onClick={() => { setFHotels(new Set()); setFServices(new Set()); setFPayment('all'); setFType('all'); setFState('all'); setSearch('') }}>
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {/* Service chips */}
          {services.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className={`dash-pill ${allServicesOn ? 'active' : ''}`} onClick={() => setFServices(new Set())}>All services</button>
              {services.map(s => (
                <button key={s._id} className="dash-pill" style={fServices.has(s._id) ? { background: s.color, color: '#fff', borderColor: 'transparent' } : {}}
                  onClick={() => setFServices(prev => { const n = new Set(prev); if (n.has(s._id)) n.delete(s._id); else n.add(s._id); return n })}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: fServices.has(s._id) ? '#fff' : s.color }} />{s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: '0 auto' }} /></div>
        ) : rows.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <div className="empty-state-icon"><CalendarDays size={22} /></div>
            <p style={{ fontSize: '0.875rem' }}>No bookings match these filters</p>
          </div>
        ) : (
          <div style={{ overflow: 'auto', maxHeight: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--gray-50)', zIndex: 1, borderBottom: '1px solid var(--gray-200)' }}>
                  <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>Date / Time <ArrowUpDown size={11} style={{ opacity: sortKey === 'date' ? 1 : 0.3 }} /></th>
                  <th className="dash-th">Service</th>
                  <th className="dash-th">Hotel</th>
                  <th className="dash-th">Guest</th>
                  <th className="dash-th">Room / Type</th>
                  <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('price')}>Price <ArrowUpDown size={11} style={{ opacity: sortKey === 'price' ? 1 : 0.3 }} /></th>
                  <th className="dash-th">Status</th>
                  <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('created')}>Created <ArrowUpDown size={11} style={{ opacity: sortKey === 'created' ? 1 : 0.3 }} /></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => {
                  const st = bookingState(b)
                  const hotel = hotels.find(h => h._id === (serviceHotel.get(svcId(b)) || ''))
                  const type = b.bookingType || 'custom'
                  return (
                    <tr key={b._id} className="dash-row" onClick={() => setDetailId(b._id)}
                      style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : '#fff', cursor: 'pointer', transition: 'background .1s' }}>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{format(parseISO(b.date), 'MMM d')}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{b.startTime}–{b.endTime}</div>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.serviceId?.color || '#6366f1', flexShrink: 0 }} />
                          <span style={{ color: 'var(--gray-700)' }}>{b.serviceId?.name}</span>
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: 600 }}>{hotel?.shortName || '—'}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--gray-800)', fontWeight: 500 }}>{b.customerName}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {b.roomNumber ? <span style={{ color: 'var(--gray-600)' }}>🏨 {b.roomNumber}</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 6, background: `${TYPE_META[type].color}14`, color: TYPE_META[type].color, fontSize: '0.66rem', fontWeight: 700 }}>
                            {TYPE_META[type].icon}{TYPE_META[type].label}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--gray-700)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {b.totalPrice > 0 ? `${money(b.totalPrice)}` : <span style={{ color: 'var(--gray-400)' }}>Free</span>}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: st.bg, color: st.color }}>
                          {st.key === 'finished' && <Check size={11} />}{st.label}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--gray-400)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {b.createdAt ? formatDistanceToNow(parseISO(b.createdAt), { addSuffix: true }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailId && (
        <BookingDrawer
          id={detailId}
          hotels={hotels}
          serviceHotel={serviceHotel}
          onClose={() => setDetailId(null)}
          onChanged={(id, changes) => patchLocal(id, changes)}
          onDeleted={(id) => { setBookings(prev => prev.filter(b => b._id !== id)); setDetailId(null) }}
          router={router}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// ── Filter group wrapper ──────────────────────────────────────────────────────
function FilterGroup({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 700 }}>{icon}{label}</span>
      {children}
    </div>
  )
}

// ── Zone A: analytics ─────────────────────────────────────────────────────────
function IncomeAnalytics({ analytics, loading, perService }: {
  analytics: { data: { label: string; expected: number; collected: number; count: number }[]; byWeek: boolean; total: number; collected: number; due: number; count: number }
  loading: boolean
  perService: { svc: Service; total: number }[]
}) {
  const total = useCountUp(analytics.total)
  const collected = useCountUp(analytics.collected)
  const due = useCountUp(analytics.due)
  const count = useCountUp(analytics.count)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: '1.5rem', alignItems: 'stretch' }}>
      <div style={{ minWidth: 0 }}>
        {/* KPI strip */}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: '1.1rem' }}>
          <Kpi label="Total income" value={`${money(total)}`} unit="UZS" color="var(--gray-900)" />
          <Kpi label="Collected" value={`${money(collected)}`} unit="UZS" color={INK_COLLECTED} dot={FILL_COLLECTED} />
          <Kpi label="Outstanding" value={`${money(due)}`} unit="UZS" color="#b45309" dot="#f59e0b" />
          <Kpi label="Bookings" value={`${Math.round(count)}`} color={EXPECTED} />
        </div>
        {/* Chart */}
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner spinner-dark" style={{ width: 26, height: 26 }} /></div>
        ) : (
          <IncomeChart key={`${analytics.data.length}-${analytics.total}`} data={analytics.data} />
        )}
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: FILL_COLLECTED }} /> Collected</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: `${EXPECTED}33`, border: `1.5px solid ${EXPECTED}` }} /> Expected (booked)</span>
        </div>
      </div>

      {/* Income by service */}
      <div style={{ borderLeft: '1px solid var(--surface-border)', paddingLeft: '1.4rem' }}>
        <h3 style={{ fontSize: '0.8rem', margin: '0 0 0.9rem' }}>Income by service</h3>
        {perService.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>No income in this period</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {perService.slice(0, 6).map(({ svc, total: t }) => {
              const pct = analytics.total > 0 ? (t / analytics.total) * 100 : 0
              return (
                <div key={svc._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--gray-700)', overflow: 'hidden' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: svc.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.name}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)', fontVariantNumeric: 'tabular-nums' }}>{money(t)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: svc.color, width: `${pct}%`, transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, unit, color, dot }: { label: string; value: string; unit?: string; color: string; dot?: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />}{label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {value}{unit && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-400)', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  )
}

// Animated bar chart: expected (indigo outline) with collected (green) overlaid.
function IncomeChart({ data }: { data: { label: string; expected: number; collected: number; count: number }[] }) {
  const [ready, setReady] = useState(false)
  const [hover, setHover] = useState<{ i: number; x: number } | null>(null)
  useEffect(() => { const id = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(id) }, [])

  const H = 200
  const max = Math.max(1, ...data.map(d => d.expected))
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(f => f * max)
  const showEveryLabel = data.length <= 16
  const step = Math.ceil(data.length / 12)

  return (
    <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
      {/* Y axis */}
      <div style={{ width: 46, height: H, position: 'relative', flexShrink: 0 }}>
        {gridVals.slice().reverse().map((v, i) => (
          <div key={i} style={{ position: 'absolute', top: `${(i / 4) * 100}%`, right: 4, transform: 'translateY(-50%)', fontSize: '0.62rem', color: 'var(--gray-400)', fontVariantNumeric: 'tabular-nums' }}>
            {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
          </div>
        ))}
      </div>
      {/* Plot */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}
        onMouseLeave={() => setHover(null)}>
        <div style={{ position: 'relative', height: H }}>
          {/* Gridlines */}
          {gridVals.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / 4) * 100}%`, borderTop: '1px solid var(--gray-100)' }} />
          ))}
          {/* Bars */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: data.length > 40 ? 1 : 3 }}>
            {data.map((d, i) => {
              const expH = ready ? (d.expected / max) * H : 0
              const colH = ready ? (d.collected / max) * H : 0
              return (
                <div key={i} className="bar-col" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', cursor: 'default' }}
                  onMouseEnter={e => setHover({ i, x: (e.currentTarget as HTMLElement).offsetLeft + (e.currentTarget as HTMLElement).offsetWidth / 2 })}>
                  {/* expected (ceiling) */}
                  <div className="bar-exp" style={{
                    position: 'relative', width: '100%', maxWidth: 34, height: expH,
                    background: `${EXPECTED}1f`, border: `1.5px solid ${EXPECTED}66`, borderBottom: 'none',
                    borderRadius: '4px 4px 0 0', transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 12}ms`,
                    boxShadow: hover?.i === i ? `0 0 0 2px ${EXPECTED}44` : 'none',
                  }}>
                    {/* collected (fill) */}
                    <div style={{ position: 'absolute', left: -1.5, right: -1.5, bottom: 0, height: colH, background: FILL_COLLECTED, borderRadius: colH >= expH - 1 ? '4px 4px 0 0' : '0', transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 12 + 60}ms` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* X labels */}
        <div style={{ display: 'flex', gap: data.length > 40 ? 1 : 3, marginTop: 6 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--gray-400)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {(showEveryLabel || i % step === 0) ? d.label : ''}
            </div>
          ))}
        </div>
        {/* Tooltip */}
        {hover && data[hover.i] && (
          <div style={{
            position: 'absolute', top: -8, left: Math.min(Math.max(hover.x, 70), 100000), transform: 'translate(-50%,-100%)',
            background: 'var(--gray-900, #111827)', color: '#fff', padding: '7px 10px', borderRadius: 8, fontSize: '0.7rem',
            pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5, boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>{data[hover.i].label} · {data[hover.i].count} booking{data[hover.i].count === 1 ? '' : 's'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: FILL_COLLECTED }} /> Collected {money(data[hover.i].collected)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.85 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: EXPECTED }} /> Expected {money(data[hover.i].expected)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Detail drawer + timeline ──────────────────────────────────────────────────
const EVENT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { label: 'Created', icon: <Plus size={13} />, color: '#6366f1' },
  paid: { label: 'Marked paid', icon: <Wallet size={13} />, color: '#059669' },
  finished: { label: 'Completed', icon: <Check size={13} />, color: '#059669' },
  notes_updated: { label: 'Notes updated', icon: <Pencil size={13} />, color: '#64748b' },
  reopened: { label: 'Reopened', icon: <RotateCcw size={13} />, color: '#d97706' },
}

function BookingDrawer({ id, hotels, serviceHotel, onClose, onChanged, onDeleted, router, showToast }: {
  id: string
  hotels: Hotel[]
  serviceHotel: Map<string, string>
  onClose: () => void
  onChanged: (id: string, changes: Partial<Booking>) => void
  onDeleted: (id: string) => void
  router: ReturnType<typeof useRouter>
  showToast: (m: string, t: 'success' | 'error' | 'info') => void
}) {
  const [b, setB] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [payConfirm, setPayConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchDetail = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`)
    const data = await res.json()
    if (res.ok) { setB(data); setNotesDraft(data.notes || '') }
    setLoading(false)
  }, [id])
  useEffect(() => { fetchDetail() }, [fetchDetail])

  async function mutate(changes: Partial<Booking>, msg: string) {
    setBusy(true)
    const res = await fetch(`/api/bookings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) })
    setBusy(false)
    if (res.ok) {
      const data = await res.json()
      setB(data); setNotesDraft(data.notes || '')
      onChanged(id, changes)
      showToast(msg, 'success')
    } else showToast('Update failed', 'error')
  }

  async function del() {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('Booking deleted', 'success'); onDeleted(id) }
    else showToast('Delete failed', 'error')
  }

  const st = b ? bookingState(b) : null
  const hotel = b ? hotels.find(h => h._id === (serviceHotel.get(svcId(b)) || '')) : null

  // Build timeline from history (fallback to derived timestamps for legacy rows).
  const timeline = useMemo(() => {
    if (!b) return []
    if (b.history && b.history.length) {
      return [...b.history].sort((a, c) => new Date(a.at).getTime() - new Date(c.at).getTime())
        .map(e => ({ action: e.action, at: e.at, by: actorName(e.by) }))
    }
    const evs: { action: string; at: string; by: string }[] = []
    if (b.createdAt) evs.push({ action: 'created', at: b.createdAt, by: actorName(b.createdBy) })
    if (b.paidAt) evs.push({ action: 'paid', at: b.paidAt, by: actorName(b.createdBy) })
    if (b.finishedAt) evs.push({ action: 'finished', at: b.finishedAt, by: actorName(b.createdBy) })
    return evs
  }, [b])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', animation: 'fadeIn 0.2s ease' }} />
      <div style={{
        position: 'relative', width: 'min(440px, 100%)', height: '100%', background: 'var(--surface-card, #fff)',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', overflowY: 'auto', animation: 'slideInRight 0.25s ease-out',
      }}>
        {loading || !b || !st ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ width: 30, height: 30, margin: '0 auto' }} /></div>
        ) : (
          <div style={{ padding: '1.25rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: `${b.serviceId?.color || '#6366f1'}1f`, color: b.serviceId?.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getServiceIcon(b.serviceId?.name || '')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gray-900)' }}>{b.customerName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{b.serviceId?.name}{hotel ? ` · ${hotel.shortName}` : ''}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            {/* Status + price banner */}
            <div style={{ display: 'flex', gap: 10, marginBottom: '1.1rem' }}>
              <div style={{ flex: 1, padding: '0.7rem 0.85rem', borderRadius: 10, background: st.bg }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: st.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 800, fontSize: '0.95rem', color: st.color, marginTop: 2 }}>
                  {st.key === 'finished' && <Check size={14} />}{st.label}
                </div>
              </div>
              <div style={{ flex: 1, padding: '0.7rem 0.85rem', borderRadius: 10, background: 'var(--gray-50)' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--gray-800)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{b.totalPrice > 0 ? `${money(b.totalPrice)} UZS` : 'Free'}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
              {!b.finished && st.key === 'unpaid' && (
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={busy} onClick={() => setPayConfirm(true)}><Wallet size={14} /> Mark as Paid</button>
              )}
              {!b.finished && st.key !== 'unpaid' && (
                <button className="btn btn-sm" style={{ flex: 1, background: FILL_COLLECTED, color: '#fff', border: 'none' }} disabled={busy} onClick={() => mutate({ finished: true }, 'Booking completed')}><Check size={15} strokeWidth={2.5} /> Mark as Finished</button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/calendar?date=${b.date}`)} title="Open in calendar"><ExternalLink size={14} /></button>
            </div>

            {/* Details grid */}
            <Section title="Details">
              <Field icon={<CalendarDays size={14} />} label="Date" value={format(parseISO(b.date), 'EEEE, MMM d, yyyy')} />
              <Field icon={<Clock size={14} />} label="Time" value={`${b.startTime} – ${b.endTime} (${b.duration} min)`} />
              {b.customerPhone && <Field icon={<Phone size={14} />} label="Phone" value={b.customerPhone} />}
              {b.roomNumber && <Field icon={<BedDouble size={14} />} label="Room" value={b.roomNumber} />}
              {b.bookingType && <Field icon={TYPE_META[b.bookingType].icon} label="Type" value={TYPE_META[b.bookingType].label} />}
              <Field icon={<User size={14} />} label="Booked by" value={actorName(b.createdBy)} />
            </Section>

            {/* Notes */}
            <Section title="Notes" action={!editingNotes ? <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => setEditingNotes(true)}><Pencil size={12} /> Edit</button> : undefined}>
              {editingNotes ? (
                <div>
                  <textarea className="form-textarea" value={notesDraft} onChange={e => setNotesDraft(e.target.value)} style={{ minHeight: 70, fontSize: '0.82rem' }} placeholder="Add notes…" />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingNotes(false); setNotesDraft(b.notes || '') }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={async () => { await mutate({ notes: notesDraft }, 'Notes saved'); setEditingNotes(false) }}>Save</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: b.notes ? 'var(--gray-700)' : 'var(--gray-400)', margin: 0, whiteSpace: 'pre-wrap' }}>{b.notes || 'No notes.'}</p>
              )}
            </Section>

            {/* Timeline */}
            <Section title="Activity">
              <div style={{ position: 'relative', paddingLeft: 8 }}>
                {timeline.map((e, i) => {
                  const meta = EVENT_META[e.action] || EVENT_META.notes_updated
                  const last = i === timeline.length - 1
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: last ? 0 : 18 }}>
                      {!last && <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 2, background: 'var(--gray-200)' }} />}
                      <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: `${meta.color}18`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-800)' }}>{meta.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                          {format(parseISO(e.at), 'MMM d, yyyy · HH:mm')} · {formatDistanceToNow(parseISO(e.at), { addSuffix: true })}
                          <span style={{ color: 'var(--gray-300)' }}> · {e.by}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {b.updatedAt && b.createdAt && new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime() > 1000 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 10, paddingLeft: 36 }}>
                    Last edited {formatDistanceToNow(parseISO(b.updatedAt), { addSuffix: true })}
                  </div>
                )}
              </div>
            </Section>

            {/* Delete */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 14, marginTop: 6 }}>
              {deleteConfirm ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginRight: 'auto' }}>Delete this booking?</span>
                  <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(true)}><Trash2 size={13} /> Delete booking</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment confirm */}
      {payConfirm && b && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setPayConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 384 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
              <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#10b98118', color: INK_COLLECTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={24} /></span>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Confirm payment</h2>
              <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Did you receive <strong style={{ color: 'var(--gray-900)' }}>{money(b.totalPrice)} UZS</strong> from <strong style={{ color: 'var(--gray-900)' }}>{b.customerName}</strong>?
              </p>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPayConfirm(false)}>Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={async () => { await mutate({ paid: true }, 'Marked as paid'); setPayConfirm(false) }}><Check size={15} strokeWidth={2.5} /> Yes, received</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.72rem', margin: 0, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
      <span style={{ color: 'var(--gray-400)', width: 16, display: 'flex', justifyContent: 'center' }}>{icon}</span>
      <span style={{ width: 76, fontSize: '0.78rem', color: 'var(--gray-500)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--gray-800)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
