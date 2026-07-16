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
      <div className="modal max-w-140" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('bookingHistory')} · {client.name}</h2>
          <Button variant="ghost" icon onClick={close} aria-label={t('close')}><X size={18} /></Button>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: t('visits'), value: String(stats.visits) },
            { label: t('totalSpent'), value: `${money(stats.totalSpent)}` },
            { label: t('outstanding'), value: `${money(stats.outstanding)}` },
            { label: t('lastVisit'), value: stats.lastVisit || '—' },
          ].map((tile, i) => (
            <div key={i} className="px-[0.7rem] py-[0.6rem] rounded-lg bg-gray-50">
              <div className="text-[0.62rem] font-bold text-gray-400 uppercase tracking-[0.04em]">{tile.label}</div>
              <div className="font-extrabold text-[0.9rem] text-gray-800 mt-0.5 tabular-nums">{tile.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-[0.85rem] text-gray-400 text-center py-4">{t('loading')}</p>
        ) : sorted.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <CalendarDays size={26} className="opacity-50 mx-auto" />
            <p className="text-[0.85rem] mt-2">{t('noBookingsForClient')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-85 overflow-y-auto">
            {sorted.map(b => {
              const st = bookingState(b)
              return (
                <div key={b._id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-gray-100">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.serviceId?.color || 'var(--brand-500)' }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.82rem] font-semibold text-gray-800 truncate">{b.serviceId?.name || '—'}</div>
                    <div className="text-[0.72rem] text-gray-500 tabular-nums">{b.date} · {b.startTime}–{b.endTime}</div>
                  </div>
                  <span className="text-[0.78rem] font-bold text-gray-700 tabular-nums">
                    {b.totalPrice > 0 ? `${money(b.totalPrice)}` : t('free')}
                  </span>
                  <Badge variant={st.badge} className="shrink-0">{t(st.key)}</Badge>
                </div>
              )
            })}
          </div>
        )}

        <div className="h-px bg-surface-border my-4" />
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={close}>{t('close')}</Button>
        </div>
      </div>
    </div>
  )
}
