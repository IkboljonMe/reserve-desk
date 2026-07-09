'use client'

import { Search, Filter, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { ServicesPageState } from '../useServicesPage'

export function ServicesFilterBar({ s }: { s: ServicesPageState }) {
  const { t } = useTranslation()
  const { hotels, searchQuery, setSearchQuery, filterHotel, setFilterHotel, filterStatus, setFilterStatus, hasActiveFilters } = s

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      marginBottom: '1.5rem',
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '0 1 320px', minWidth: 200 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: '0.8125rem' }}
          placeholder={t('searchServices')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label={t('searchServices')}
        />
      </div>

      {/* Filters group, pushed to the right */}
      <div style={{ width: 1, height: 24, background: 'var(--gray-200)', flexShrink: 0, marginLeft: 'auto' }} />

      {/* Hotel filter pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>
          <Filter size={12} /> {t('hotel')}
        </span>
        <button
          className={`svc-filter-pill ${filterHotel === '' ? 'active' : ''}`}
          onClick={() => setFilterHotel('')}
        >
          {t('all')}
        </button>
        {hotels.map(h => (
          <button
            key={h._id}
            className={`svc-filter-pill ${filterHotel === h._id ? 'active' : ''}`}
            onClick={() => setFilterHotel(filterHotel === h._id ? '' : h._id)}
          >
            {h.shortName || h.name}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--gray-200)', flexShrink: 0 }} />

      {/* Status filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>{t('status')}</span>
        {(['', 'active', 'inactive'] as const).map(val => (
          <button
            key={val || 'all'}
            className={`svc-filter-pill ${filterStatus === val ? 'active' : ''}`}
            onClick={() => setFilterStatus(val)}
          >
            {val === '' ? t('all') : t(val)}
          </button>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setSearchQuery(''); setFilterHotel(''); setFilterStatus('') }}
          style={{ marginLeft: 'auto', color: 'var(--gray-400)', fontSize: '0.75rem' }}
        >
          <X size={13} /> {t('clear')}
        </button>
      )}
    </div>
  )
}
