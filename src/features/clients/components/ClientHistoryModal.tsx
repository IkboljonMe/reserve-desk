'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, CalendarDays } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { bookingState, amountCollected, money } from '@/lib/bookingHelpers'
import { Badge } from '@/components/ui/Badge'
import type { Booking } from '@/types'
import type { ClientsPageState } from '../useClientsPage'
import Button from '@/components/ui/Button'

// A saved client's booking history: quick totals + a chronological list. Fetches
// on open via the bookings API's clientId filter. Mounted with key={client._id}.
export function ClientHistoryModal({ s }: { s: ClientsPageState }) {
  const { t } = useTranslation()
  const { historyClient: client, setHistoryClient } = s

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // The modal is mounted with key={client._id}, so `loading` starts true per open.
  useEffect(() => {
    if (!client) return
    let alive = true
    fetch(`/api/bookings?clientId=${client._id}`)
      .then(r => r.json())
      .then((data: unknown) => { if (alive) setBookings(Array.isArray(data) ? data : []) })
      .catch(() => { if (alive) setBookings([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [client])

  // Cancelled bookings don't count toward spend/visits.
  const active = useMemo(() => bookings.filter(b => b.status !== 'cancelled'), [bookings])
  const stats = useMemo(() => {
    const totalSpent = active.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const collected = active.reduce((sum, b) => sum + amountCollected(b), 0)
    const lastVisit = active.map(b => b.date).sort().at(-1) || null
    return { visits: active.length, totalSpent, collected, outstanding: Math.max(0, totalSpent - collected), lastVisit }
  }, [active])

  if (!client) return null

  const sorted = [...active].sort((a, b) => (a.date + a.startTime < b.date + b.startTime ? 1 : -1))
  const close = () => setHistoryClient(null)

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>{t('bookingHistory')} · {client.name}</h2>
          <Button variant="ghost" icon onClick={close} aria-label={t('close')}><X size={18} /></Button>
        </div>

        {/* Summary tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1rem' }}>
          {[
            { label: t('visits'), value: String(stats.visits) },
            { label: t('totalSpent'), value: `${money(stats.totalSpent)}` },
            { label: t('outstanding'), value: `${money(stats.outstanding)}` },
            { label: t('lastVisit'), value: stats.lastVisit || '—' },
          ].map((tile, i) => (
            <div key={i} style={{ padding: '0.6rem 0.7rem', borderRadius: 8, background: 'var(--gray-50)' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tile.label}</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--gray-800)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{tile.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', textAlign: 'center', padding: '1rem 0' }}>{t('loading')}</p>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--gray-400)' }}>
            <CalendarDays size={26} style={{ opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem', margin: '8px 0 0' }}>{t('noBookingsForClient')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
            {sorted.map(b => {
              const st = bookingState(b)
              return (
                <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--gray-100)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.serviceId?.color || 'var(--brand-500)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.serviceId?.name || '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', fontVariantNumeric: 'tabular-nums' }}>{b.date} · {b.startTime}–{b.endTime}</div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-700)', fontVariantNumeric: 'tabular-nums' }}>
                    {b.totalPrice > 0 ? `${money(b.totalPrice)}` : t('free')}
                  </span>
                  <Badge variant={st.badge} className="shrink-0">{t(st.key)}</Badge>
                </div>
              )
            })}
          </div>
        )}

        <div className="h-px bg-surface-border my-4" />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={close}>{t('close')}</Button>
        </div>
      </div>
    </div>
  )
}
