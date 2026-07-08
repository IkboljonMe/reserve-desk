'use client'

import { useTranslation } from '@/i18n'
import type { ContractStatus } from './ContractModal'

export function ExpiryPill({ status, daysLeft }: { status: ContractStatus; daysLeft: number | null }) {
  const { t } = useTranslation()
  if (status === 'terminated') return <span style={{ color: 'var(--gray-300)' }}>—</span>
  if (daysLeft === null) return <span style={{ color: 'var(--gray-300)' }}>{t('noDate')}</span>

  let color = '#0f9d58', bg = 'rgba(16,185,129,0.12)', label = t('daysLeft', { days: daysLeft })
  if (daysLeft < 0) { color = 'var(--danger)'; bg = 'rgba(239,68,68,0.12)'; label = t('expiredAgo', { days: Math.abs(daysLeft) }) }
  else if (daysLeft === 0) { color = 'var(--danger)'; bg = 'rgba(239,68,68,0.12)'; label = t('expiresToday') }
  else if (daysLeft <= 7) { color = '#c2410c'; bg = 'rgba(234,88,12,0.12)'; label = t('daysLeft', { days: daysLeft }) }
  else if (daysLeft <= 30) { color = '#b7791f'; bg = 'rgba(245,158,11,0.15)'; label = t('daysLeft', { days: daysLeft }) }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 20, background: bg, color, fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
      {label}
    </span>
  )
}
