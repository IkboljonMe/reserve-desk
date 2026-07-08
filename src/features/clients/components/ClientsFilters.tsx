'use client'

import { useTranslation } from '@/i18n'
import type { ClientsPageState } from '../useClientsPage'

export function ClientsFilters({ s }: { s: ClientsPageState }) {
  const { t } = useTranslation()
  const { search, setSearch, groupFilter, setGroupFilter, groups } = s

  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="form-input"
            style={{ border: 'none', padding: '0 4px', boxShadow: 'none' }}
            placeholder={t('searchClientsPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 160 }}
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
          aria-label={t('filterByGroup')}
        >
          <option value="">{t('allGroups')}</option>
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          <option value="none">{t('ungrouped')}</option>
        </select>
      </div>
    </div>
  )
}
