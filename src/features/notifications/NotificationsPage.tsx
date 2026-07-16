'use client'

import Link from 'next/link'
import { useTranslation } from '@/i18n'
import { useNotificationsPage } from './useNotificationsPage'
import { NotificationGroup } from './components/NotificationGroup'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

export default function NotificationsPage() {
  const { t, lang } = useTranslation()
  const { items, loading, refetch, dismissing, dismiss, grouped } = useNotificationsPage()

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1>{t('notifications')}</h1>
          <p className="mt-1">{t('notificationsSubtitle')}</p>
        </div>
        <Button variant="secondary" onClick={() => refetch()} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {t('refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-4 flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-2.5 w-[35%]" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-0 overflow-hidden">
          <EmptyState
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            iconStyle={{ color: 'var(--success)' }}
          >
            <h3 className="text-gray-700">{t('allCaughtUp')}</h3>
            <p>{t('noNotificationsDesc')}</p>
            <Link
              href={`/${lang}/contracts`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--gray-200,#e5e7eb)] bg-white py-2 px-4 text-sm font-semibold text-[var(--gray-700)] whitespace-nowrap tracking-tight shadow-sm transition-colors duration-150 hover:bg-[var(--gray-50,#f9fafb)] hover:border-[var(--gray-300)] mt-2"
            >
              {t('goToContracts')}
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ tier, list }) => (
            <NotificationGroup key={tier} tier={tier} list={list} dismissing={dismissing} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  )
}
