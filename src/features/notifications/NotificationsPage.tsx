'use client'

import Link from 'next/link'
import { useTranslation } from '@/i18n'
import { useNotificationsPage } from './useNotificationsPage'
import { NotificationGroup } from './components/NotificationGroup'
import { Skeleton } from '@/components/ui/Skeleton'

export default function NotificationsPage() {
  const { t, lang } = useTranslation()
  const { items, loading, refetch, dismissing, dismiss, grouped } = useNotificationsPage()

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1>{t('notifications')}</h1>
          <p style={{ marginTop: 4 }}>{t('notificationsSubtitle')}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => refetch()} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {t('refresh')}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skeleton style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton style={{ height: 12, width: '60%' }} />
                <Skeleton style={{ height: 10, width: '35%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>{t('allCaughtUp')}</h3>
            <p>{t('noNotificationsDesc')}</p>
            <Link href={`/${lang}/contracts`} className="btn btn-secondary" style={{ marginTop: 8 }}>{t('goToContracts')}</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {grouped.map(({ tier, list }) => (
            <NotificationGroup key={tier} tier={tier} list={list} dismissing={dismissing} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  )
}
