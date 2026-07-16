'use client'

import { useTranslation } from '@/i18n'
import { StatCard } from './StatCard'
import type { ContractsPageState } from '../useContractsPage'

export function ContractStats({ stats }: { stats: ContractsPageState['stats'] }) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 mb-4">
      <StatCard label={t('totalContracts')} value={stats.total} tint="var(--brand-600)" tintBg="var(--brand-100)" icon="doc" />
      <StatCard label={t('signed')} value={stats.signed} tint="#0f9d58" tintBg="rgba(16,185,129,0.14)" icon="check" />
      <StatCard label={t('expiring30')} value={stats.expiring} tint="#b7791f" tintBg="rgba(245,158,11,0.16)" icon="clock" />
      <StatCard label={t('expired')} value={stats.expired} tint="var(--danger)" tintBg="rgba(239,68,68,0.13)" icon="alert" />
    </div>
  )
}
