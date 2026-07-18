'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useToast } from '@/components/ToastProvider'
import { getCompanies, type CompanyRecord } from '@/lib/api/companies'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

const EXPIRING_SOON_DAYS = 14

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [companies, setCompanies] = useState<CompanyRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const all = await getCompanies()
      const relevant = all
        .filter(c => daysLeft(c.expiresAt) <= EXPIRING_SOON_DAYS)
        .sort((a, b) => daysLeft(a.expiresAt) - daysLeft(b.expiresAt))
      setCompanies(relevant)
    } catch {
      showToast(t('loadCompaniesFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold">{t('notifications')}</h2>
        <p className="mt-0.5 text-gray-500 text-sm">{t('notificationsSubtitle')}</p>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <table className="w-full border-collapse">
            <tbody><SkeletonTableRows rows={4} columns={3} /></tbody>
          </table>
        ) : companies.length === 0 ? (
          <EmptyState icon={<Building2 size={24} strokeWidth={1.75} />}>
            <h3 className="text-gray-700">{t('noNotificationsTitle')}</h3>
            <p>{t('noNotificationsDesc')}</p>
          </EmptyState>
        ) : (
          <div className="flex flex-col">
            {companies.map((c, i) => {
              const left = daysLeft(c.expiresAt)
              const expired = left < 0
              return (
                <div
                  key={c._id}
                  className={`flex items-center gap-3 p-[12px_16px] ${i === 0 ? '' : 'border-t border-gray-100'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">{c.name}</div>
                    <div className="text-[0.8125rem] text-gray-500">/{c.slug}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-xs font-semibold tracking-[0.01em] shrink-0 ${
                      expired ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {expired
                      ? t('expiredDaysAgo', { days: Math.abs(left) })
                      : left === 0
                        ? t('expiresToday')
                        : t('expiresInDays', { days: left })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
