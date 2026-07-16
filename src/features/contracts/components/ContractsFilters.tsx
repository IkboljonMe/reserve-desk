'use client'

import { useTranslation } from '@/i18n'
import Dropdown from '@/components/ui/Dropdown'
import type { ContractStatus } from './ContractModal'
import type { ExpiryFilter, SortKey } from '../constants'
import type { ContractsPageState } from '../useContractsPage'
import Button from '@/components/ui/Button'

export function ContractsFilters({ s }: { s: ContractsPageState }) {
  const { t } = useTranslation()
  const { search, setSearch, statusFilter, setStatusFilter, expiryFilter, setExpiryFilter, sortKey, setSortKey, activeFilterCount } = s

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-4 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-[var(--gray-800)] placeholder:text-[var(--gray-400)] px-1"
            placeholder={t('searchContractsPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="min-w-[150px]">
          <Dropdown
            value={statusFilter}
            onChange={val => setStatusFilter(val as '' | ContractStatus)}
            options={[
              { value: '', label: t('allStatuses') },
              { value: 'signed', label: t('signed') },
              { value: 'awaiting', label: t('awaitingSignature') },
              { value: 'terminated', label: t('terminated') },
            ]}
            ariaLabel={t('filterByStatus')}
          />
        </div>

        <div className="min-w-[160px]">
          <Dropdown
            value={expiryFilter}
            onChange={val => setExpiryFilter(val as ExpiryFilter)}
            options={[
              { value: 'all', label: t('anyExpiry') },
              { value: 'expiring', label: t('expiringSoon30') },
              { value: 'expired', label: t('expired') },
              { value: 'active', label: t('activeOver30') },
            ]}
            ariaLabel={t('filterByExpiry')}
          />
        </div>

        <div className="min-w-[150px]">
          <Dropdown
            value={sortKey}
            onChange={val => setSortKey(val as SortKey)}
            options={[
              { value: 'finishSoon', label: t('finishSoonest') },
              { value: 'finishLate', label: t('finishLatest') },
              { value: 'nameAsc', label: t('nameAZ') },
            ]}
            ariaLabel={t('sort')}
          />
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setExpiryFilter('all') }}>
            {t('clearFilters')}
          </Button>
        )}
      </div>
    </div>
  )
}
