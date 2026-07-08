'use client'

import { useTranslation } from '@/i18n'
import Dropdown from '@/components/ui/Dropdown'
import type { ContractStatus } from './ContractModal'
import type { ExpiryFilter, SortKey } from '../constants'
import type { ContractsPageState } from '../useContractsPage'

export function ContractsFilters({ s }: { s: ContractsPageState }) {
  const { t } = useTranslation()
  const { search, setSearch, statusFilter, setStatusFilter, expiryFilter, setExpiryFilter, sortKey, setSortKey, activeFilterCount } = s

  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="form-input"
            style={{ border: 'none', padding: '0 4px', boxShadow: 'none' }}
            placeholder={t('searchContractsPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: 150 }}>
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

        <div style={{ minWidth: 160 }}>
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

        <div style={{ minWidth: 150 }}>
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
          <button className="btn btn-ghost btn-sm" onClick={() => { setStatusFilter(''); setExpiryFilter('all') }}>
            {t('clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
