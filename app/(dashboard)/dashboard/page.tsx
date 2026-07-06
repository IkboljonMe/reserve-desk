'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { getServiceIcon } from '@/lib/serviceIcons'
import { useToast } from '@/components/ToastProvider'

interface Service {
  _id: string
  name: string
  color: string
  isActive: boolean
}

interface Booking {
  _id: string
  serviceId: { _id: string; name: string; color: string }
  customerName: string
  roomNumber: string
  date: string
  startTime: string
  endTime: string
  status: string
  totalPrice: number
  duration: number
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: color || 'var(--gray-900)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#10b981',
  pending: '#f59e0b',
  cancelled: '#ef4444',
}
const STATUS_BG: Record<string, string> = {
  confirmed: '#d1fae5',
  pending: '#fef3c7',
  cancelled: '#fee2e2',
}

export default function DashboardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const [services, setServices] = useState<Service[]>([])
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [weekBookings, setWeekBookings] = useState<Booking[]>([])
  const [monthBookings, setMonthBookings] = useState<Booking[]>([])
  const [upcoming, setUpcoming] = useState<Booking[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterService, setFilterService] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [svcRes, todayRes, weekRes, monthRes, upcomingRes, clientsRes] = await Promise.all([
        fetch('/api/services'),
        fetch(`/api/bookings?dateFrom=${today}&dateTo=${today}`),
        fetch(`/api/bookings?dateFrom=${weekStart}&dateTo=${weekEnd}`),
        fetch(`/api/bookings?dateFrom=${monthStart}&dateTo=${monthEnd}`),
        fetch(`/api/bookings?dateFrom=${today}&dateTo=${format(addDays(new Date(), 14), 'yyyy-MM-dd')}`),
        fetch('/api/clients'),
      ])
      const [svcs, tb, wb, mb, ub, clients] = await Promise.all([
        svcRes.json(),
        todayRes.json(),
        weekRes.json(),
        monthRes.json(),
        upcomingRes.json(),
        clientsRes.json(),
      ])
      setServices(Array.isArray(svcs) ? svcs.filter((s: Service) => s.isActive) : [])
      setTodayBookings(Array.isArray(tb) ? tb : [])
      setWeekBookings(Array.isArray(wb) ? wb : [])
      setMonthBookings(Array.isArray(mb) ? mb : [])
      setUpcoming(Array.isArray(ub) ? ub : [])
      setClientCount(Array.isArray(clients) ? clients.length : 0)
    } catch (e) {
      showToast('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }, [today, weekStart, weekEnd, monthStart, monthEnd, showToast])

  useEffect(() => { loadAll() }, [loadAll])

  const activeToday = todayBookings.filter(b => b.status !== 'cancelled')
  const todayRevenue = activeToday.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  const weekRevenue = weekBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  const monthRevenue = monthBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  // Per-service booking counts today
  const perService = services.map(svc => ({
    svc,
    count: activeToday.filter(b => b.serviceId?._id === svc._id).length,
  })).filter(x => x.count > 0)

  // Filtered upcoming bookings
  const filteredUpcoming = upcoming.filter(b => {
    if (filterService !== 'all' && b.serviceId?._id !== filterService) return false
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ marginTop: 4 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadAll} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            Refresh
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => router.push(`/book?date=${today}`)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New Booking
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard
          label="Today's Bookings"
          value={loading ? '—' : activeToday.length}
          sub={`${todayBookings.filter(b => b.status === 'cancelled').length} cancelled`}
          color="var(--brand-500)"
        />
        <StatCard
          label="Today's Revenue"
          value={loading ? '—' : `${todayRevenue.toLocaleString()} UZS`}
          color="var(--success)"
        />
        <StatCard
          label="This Week"
          value={loading ? '—' : `${weekRevenue.toLocaleString()} UZS`}
          sub={`${weekBookings.filter(b => b.status !== 'cancelled').length} bookings`}
        />
        <StatCard
          label="This Month"
          value={loading ? '—' : `${monthRevenue.toLocaleString()} UZS`}
          sub={`${monthBookings.filter(b => b.status !== 'cancelled').length} bookings`}
        />
        <StatCard
          label="Active Services"
          value={loading ? '—' : services.length}
        />
        <StatCard
          label="Saved Clients"
          value={loading ? '—' : clientCount}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Upcoming bookings */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Filter bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--surface-border)',
            flexWrap: 'wrap',
          }}>
            <h3 style={{ marginRight: 'auto', fontSize: '0.9375rem' }}>Upcoming Bookings</h3>

            {/* Service filter */}
            <select
              className="form-select"
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              style={{ maxWidth: 160, fontSize: '0.8125rem', padding: '5px 10px' }}
            >
              <option value="all">All Services</option>
              {services.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ maxWidth: 140, fontSize: '0.8125rem', padding: '5px 10px' }}
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="spinner spinner-dark" style={{ width: 28, height: 28, margin: '0 auto' }} />
            </div>
          ) : filteredUpcoming.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M8 2v4M16 2v4M3 10h18"/>
                </svg>
              </div>
              <p style={{ fontSize: '0.875rem' }}>No upcoming bookings</p>
            </div>
          ) : (
            <div style={{ overflow: 'auto', maxHeight: 480 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                    {['Date', 'Time', 'Room', 'Guest', 'Service', 'Status', 'Price'].map(col => (
                      <th key={col} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUpcoming.map((b, i) => (
                    <tr
                      key={b._id}
                      style={{
                        borderBottom: '1px solid var(--gray-100)',
                        background: i % 2 === 0 ? '#fff' : 'var(--gray-50)',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onClick={() => router.push(`/calendar?date=${b.date}`)}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brand-50)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : 'var(--gray-50)'}
                    >
                      <td style={{ padding: '10px 12px', color: 'var(--gray-700)' }}>{b.date}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>
                        {b.startTime} – {b.endTime}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--gray-700)', fontWeight: 500 }}>
                        {b.roomNumber ? `🏨 ${b.roomNumber}` : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--gray-800)', fontWeight: 500 }}>
                        {b.customerName}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.serviceId?.color || '#6366f1', flexShrink: 0 }} />
                          <span style={{ color: 'var(--gray-700)' }}>{b.serviceId?.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '2px 8px', borderRadius: 20,
                          fontSize: '0.7rem', fontWeight: 600,
                          background: STATUS_BG[b.status] || 'var(--gray-100)',
                          color: STATUS_COLORS[b.status] || 'var(--gray-500)',
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--gray-700)', fontSize: '0.75rem' }}>
                        {b.totalPrice > 0 ? `${b.totalPrice.toLocaleString()} UZS` : <span style={{ color: 'var(--success)', fontWeight: 600 }}>Free</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Today's service breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Today by service */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Today by Service</h3>
            {loading ? (
              <div style={{ color: 'var(--gray-400)', fontSize: '0.8125rem' }}>Loading…</div>
            ) : services.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>No active services</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {services.map(svc => {
                  const count = activeToday.filter(b => b.serviceId?._id === svc._id).length
                  return (
                    <div key={svc._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `${svc.color}18`,
                        color: svc.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {getServiceIcon(svc.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.name}</div>
                        <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 2, marginTop: 4 }}>
                          <div style={{
                            height: '100%',
                            borderRadius: 2,
                            background: svc.color,
                            width: count > 0 ? `${Math.min((count / Math.max(activeToday.length, 1)) * 100, 100)}%` : '0%',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                      <span style={{
                        fontWeight: 700,
                        color: count > 0 ? svc.color : 'var(--gray-300)',
                        fontSize: '0.9375rem',
                        minWidth: 20,
                        textAlign: 'right',
                      }}>
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => router.push(`/book?date=${today}`)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                New Booking
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => router.push('/calendar')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Open Calendar
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => router.push('/clients')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Manage Clients
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
