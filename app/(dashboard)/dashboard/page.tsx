'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, eachWeekOfInterval, addDays, subDays, differenceInCalendarDays, formatDistanceToNow,
} from 'date-fns'
import { nowUZ } from '@/lib/timezone'
import { useToast } from '@/components/ToastProvider'
import { useTranslation, DictionaryKeys } from '@/lib/i18n'
import Dropdown from '@/components/ui/Dropdown'
import {
  Search, X, Wallet, Building2, Users, BedDouble, SlidersHorizontal,
  Plus, CalendarDays, ArrowUpDown, Check,
} from 'lucide-react'
import {
  svcId,
  extractHotelId,
  bookingState,
  money,
} from '@/lib/bookingHelpers'
import { useQueryClient } from '@tanstack/react-query'
import { Booking, Service, Hotel } from '@/types'
import { useServicesQuery } from '@/hooks/useServices'
import { useHotelsQuery } from '@/hooks/useHotels'
import { useBookingsQuery } from '@/hooks/useBookings'
import IncomeAnalytics from '@/components/dashboard/IncomeAnalytics'
import BookingDrawer from '@/components/dashboard/BookingDrawer'
import * as XLSX from 'xlsx'

type PaymentFilter = 'all' | 'paid' | 'unpaid' | 'free'
type TypeFilter = 'all' | 'client' | 'room' | 'custom'
type StateFilter = 'all' | 'active' | 'finished'
type PeriodKey = 'week' | 'month' | '7d' | '30d' | 'custom'

const TYPE_META: Record<string, { labelKey: DictionaryKeys; icon: React.ReactNode; color: string }> = {
  client: { labelKey: 'typeClient', icon: <Users size={12} />, color: '#3b82f6' },
  room: { labelKey: 'typeRoom', icon: <BedDouble size={12} />, color: '#10b981' },
  custom: { labelKey: 'typeCustom', icon: <SlidersHorizontal size={12} />, color: '#f59e0b' },
}

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
  const { t } = useTranslation()

  const { data: servicesRaw = [] } = useServicesQuery()
  const { data: hotels = [] } = useHotelsQuery()
  const services = useMemo(() => servicesRaw.filter(s => s.isActive), [servicesRaw])

  // Period
  const [period, setPeriod] = useState<PeriodKey>('month')
  const [customFrom, setCustomFrom] = useState(format(subDays(nowUZ(), 29), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(nowUZ(), 'yyyy-MM-dd'))
  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo])

  const { data: bookingsRaw = [], isLoading: loading } = useBookingsQuery(range.from, range.to)
  const bookings = useMemo(() => bookingsRaw.filter(b => b.status !== 'cancelled'), [bookingsRaw])

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

  const queryClient = useQueryClient()
  
  // Optimistic local patch after a mutation.
  const patchLocal = useCallback((id: string, changes: Partial<Booking>) => {
    queryClient.setQueriesData({ queryKey: ['bookings'] }, (old: any) => {
      if (!Array.isArray(old)) return old
      return old.map(b => (b._id === id ? { ...b, ...changes } : b))
    })
  }, [queryClient])

  function exportToExcel() {
    if (rows.length === 0) {
      showToast(t('noDataToExport'), 'error')
      return
    }

    const data = rows.map((b, index) => {
      const hotel = hotels.find(h => h._id === serviceHotel.get(svcId(b)))
      const st = bookingState(b)
      return {
        '#': index + 1,
        'Guest Name': b.customerName,
        'Phone': b.customerPhone,
        'Hotel': hotel?.name || '—',
        'Room': b.roomNumber || '—',
        'Service': b.serviceId?.name || '—',
        'Date': b.date,
        'Time': `${b.startTime} - ${b.endTime}`,
        'Price': b.totalPrice,
        'Status': st.label,
        'Notes': b.notes || '',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Auto-fit column widths
    const maxLens = Object.keys(data[0] || {}).reduce((acc: any, key) => {
      acc[key] = key.length
      return acc
    }, {})
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = String((row as any)[key] ?? '')
        maxLens[key] = Math.max(maxLens[key], val.length)
      })
    })
    worksheet['!cols'] = Object.keys(maxLens).map(key => ({
      wch: Math.min(Math.max(maxLens[key] + 3, 10), 50)
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')
    XLSX.writeFile(workbook, `bookings_${range.from}_to_${range.to}.xlsx`)
    showToast(t('excelDownloadStarted'), 'success')
  }

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
          <h1>{t('dashboard')}</h1>
          <p style={{ marginTop: 4 }}>{format(nowUZ(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="dash-seg">
            {([['week', t('periodWeek')], ['month', t('periodMonth')], ['7d', '7d'], ['30d', '30d'], ['custom', t('periodCustom')]] as [PeriodKey, string][]).map(([k, l]) => (
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
            <Plus size={14} strokeWidth={2.5} /> {t('newBooking')}
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
            <h3 style={{ fontSize: '0.95rem', margin: 0, marginRight: 4 }}>{t('bookings')}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, marginRight: 8 }}>{rows.length} {t('inRange')}</span>
            <button
              onClick={exportToExcel}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', height: '30px', fontSize: '0.8rem', cursor: 'pointer' }}
              title={t('exportTitle')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('exportBtn')}
            </button>
            <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
              <input className="form-input" style={{ paddingLeft: 32, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem' }}
                placeholder={t('searchGuestRoomPhone')} value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }} aria-label={t('clear')}><X size={14} /></button>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Hotels */}
            {hotels.length > 1 && (
              <FilterGroup icon={<Building2 size={12} />} label={t('hotel')}>
                <button className={`dash-pill ${allHotelsOn ? 'active' : ''}`} onClick={() => setFHotels(new Set())}>{t('all')}</button>
                {hotels.map(h => (
                  <button key={h._id} className={`dash-pill ${fHotels.has(h._id) ? 'active' : ''}`}
                    onClick={() => setFHotels(prev => { const n = new Set(prev); if (n.has(h._id)) n.delete(h._id); else n.add(h._id); return n })}>{h.shortName}</button>
                ))}
              </FilterGroup>
            )}
            {/* Payment */}
            <div style={{ minWidth: 140 }}>
              <Dropdown
                value={fPayment}
                onChange={val => setFPayment(val as PaymentFilter)}
                options={[
                  { value: 'all', label: t('allPayments') },
                  { value: 'paid', label: t('paid') },
                  { value: 'unpaid', label: t('unpaid') },
                  { value: 'free', label: t('free') },
                ]}
                icon={<Wallet size={12} />}
              />
            </div>

            {/* Type */}
            <div style={{ minWidth: 120 }}>
              <Dropdown
                value={fType}
                onChange={val => setFType(val as TypeFilter)}
                options={[
                  { value: 'all', label: t('allTypes') },
                  { value: 'client', label: t('typeClient') },
                  { value: 'room', label: t('typeRoom') },
                  { value: 'custom', label: t('typeCustom') },
                ]}
              />
            </div>

            {/* State */}
            <div style={{ minWidth: 120 }}>
              <Dropdown
                value={fState}
                onChange={val => setFState(val as StateFilter)}
                options={[
                  { value: 'all', label: t('allStates') },
                  { value: 'active', label: t('active') },
                  { value: 'finished', label: t('finished') },
                ]}
              />
            </div>
            {activeFilterCount > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}
                onClick={() => { setFHotels(new Set()); setFServices(new Set()); setFPayment('all'); setFType('all'); setFState('all'); setSearch('') }}>
                <X size={13} /> {t('clear')}
              </button>
            )}
          </div>

          {/* Service chips */}
          {services.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className={`dash-pill ${allServicesOn ? 'active' : ''}`} onClick={() => setFServices(new Set())}>{t('allServices')}</button>
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
            <p style={{ fontSize: '0.875rem' }}>{t('noBookingsMatch')}</p>
          </div>
        ) : (
          <div style={{ overflow: 'auto', maxHeight: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--gray-50)', zIndex: 1, borderBottom: '1px solid var(--gray-200)' }}>
                  <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>{t('colDateTime')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'date' ? 1 : 0.3 }} /></th>
                  <th className="dash-th">{t('service')}</th>
                  <th className="dash-th">{t('hotel')}</th>
                  <th className="dash-th">{t('guest')}</th>
                  <th className="dash-th">{t('roomType')}</th>
                  <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('price')}>{t('price')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'price' ? 1 : 0.3 }} /></th>
                  <th className="dash-th">{t('status')}</th>
                  <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('created')}>{t('created')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'created' ? 1 : 0.3 }} /></th>
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
                            {TYPE_META[type].icon}{t(TYPE_META[type].labelKey)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--gray-700)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {b.totalPrice > 0 ? `${money(b.totalPrice)}` : <span style={{ color: 'var(--gray-400)' }}>{t('free')}</span>}
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
          onDeleted={(id) => {
            queryClient.setQueriesData({ queryKey: ['bookings'] }, (old: any) => {
              if (!Array.isArray(old)) return old
              return old.filter(b => b._id !== id)
            })
            setDetailId(null)
          }}
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
