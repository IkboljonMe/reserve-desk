'use client'

import Link from 'next/link'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import { ContractNotification, NotificationTier } from '@/types'
import { TIER_META } from '../constants'
import { fmtDate } from '../utils'

export function NotificationGroup({
  tier, list, dismissing, onDismiss,
}: {
  tier: NotificationTier
  list: ContractNotification[]
  dismissing: string | null
  onDismiss: (n: ContractNotification) => void
}) {
  const { t, lang } = useTranslation()
  const meta = TIER_META[tier]

  return (
    <div>
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
                <Link href={`/${lang}/contracts`} className="btn btn-secondary btn-sm">{t('view')}</Link>
                <button className="btn btn-ghost btn-sm" onClick={() => onDismiss(n)} disabled={dismissing === key}>
                  {dismissing === key ? <Spinner size={18} /> : t('dismiss')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
