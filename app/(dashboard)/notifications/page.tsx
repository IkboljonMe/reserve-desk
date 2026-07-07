'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import { formatUZ } from '@/lib/timezone'
import { useTranslation, DictionaryKeys } from '@/lib/i18n'

type NotificationTier = 'expired' | 'urgent' | 'warning'

interface ContractNotification {
  contractId: string
  organizationName: string
  contractNumber: string
  finishDate: string | null
  daysLeft: number
  tier: NotificationTier
  threshold: number
  title: string
  message: string
}

const TIER_META: Record<NotificationTier, { labelKey: DictionaryKeys; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  expired: {
    labelKey: 'tierExpired',
    color: 'var(--danger)',
    bg: 'rgba(239,68,68,0.09)',
    border: 'rgba(239,68,68,0.28)',
    icon: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  },
  urgent: {
    labelKey: 'tierUrgent',
    color: '#c2410c',
    bg: 'rgba(234,88,12,0.08)',
    border: 'rgba(234,88,12,0.26)',
    icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  },
  warning: {
    labelKey: 'tierUpcoming',
    color: '#b7791f',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.28)',
    icon: <><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></>,
  },
}

const TIER_ORDER: NotificationTier[] = ['expired', 'urgent', 'warning']

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return formatUZ(d, { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NotificationsPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [items, setItems] = useState<ContractNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setItems(Array.isArray(data.notifications) ? data.notifications : [])
    } catch {
      showToast(t('loadNotificationsFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  useEffect(() => { load() }, [load])

  async function dismiss(n: ContractNotification) {
    setDismissing(n.contractId + ':' + n.threshold)
    try {
      const res = await fetch(`/api/contracts/${n.contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissReminder: n.threshold }),
      })
      if (!res.ok) throw new Error()
      setItems(prev => prev.filter(x => !(x.contractId === n.contractId && x.threshold === n.threshold)))
      // Let the sidebar badge refresh.
      window.dispatchEvent(new Event('notifications-updated'))
      showToast(t('reminderDismissed'), 'success')
    } catch {
      showToast(t('dismissFailed'), 'error')
    } finally {
      setDismissing(null)
    }
  }

  const grouped = TIER_ORDER
    .map(tier => ({ tier, list: items.filter(i => i.tier === tier) }))
    .filter(g => g.list.length > 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('notifications')}</h1>
          <p style={{ marginTop: 4 }}>{t('notificationsSubtitle')}</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {t('refresh')}
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>{t('allCaughtUp')}</h3>
            <p>{t('noNotificationsDesc')}</p>
            <Link href="/contracts" className="btn btn-secondary" style={{ marginTop: 8 }}>{t('goToContracts')}</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {grouped.map(({ tier, list }) => {
            const meta = TIER_META[tier]
            return (
              <div key={tier}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: meta.color }}>{t(meta.labelKey)}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-400)', background: 'var(--gray-100)', borderRadius: 20, padding: '1px 8px' }}>{list.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {list.map(n => {
                    const key = n.contractId + ':' + n.threshold
                    return (
                      <div key={key} className="card" style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'flex-start', gap: 14, borderLeft: `3px solid ${meta.color}`, background: meta.bg }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-xs)' }}>
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.9rem' }}>{n.title}</div>
                          <div style={{ color: 'var(--gray-600)', fontSize: '0.83rem', marginTop: 2 }}>{n.message}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 8, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            {n.contractNumber && <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>№ {n.contractNumber}</span>}
                            <span>{t('finishColon', { date: fmtDate(n.finishDate) })}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <Link href="/contracts" className="btn btn-secondary btn-sm">{t('view')}</Link>
                          <button className="btn btn-ghost btn-sm" onClick={() => dismiss(n)} disabled={dismissing === key}>
                            {dismissing === key ? <span className="spinner spinner-dark" /> : t('dismiss')}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
