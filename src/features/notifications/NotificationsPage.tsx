'use client'

import Link from 'next/link'
import { useTranslation } from '@/i18n'
import { useNotificationsPage } from './useNotificationsPage'
import { NotificationGroup } from './components/NotificationGroup'

export default function NotificationsPage() {
  const { t, lang } = useTranslation()
  const { items, loading, refetch, dismissing, dismiss, grouped } = useNotificationsPage()

  return (
    <div>
      <div className="page-header">
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
