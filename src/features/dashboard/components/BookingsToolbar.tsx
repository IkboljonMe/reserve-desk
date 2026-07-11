'use client'

import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { DashboardPageState } from '../useDashboardPage'
import { FiltersModal } from './FiltersModal'

export function BookingsToolbar({ s }: { s: DashboardPageState }) {
  const { t } = useTranslation()
  const { rows, exportToExcel, search, setSearch, activeFilterCount } = s
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '0.95rem', margin: 0, marginRight: 4 }}>{t('bookings')}</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, marginRight: 8 }}>{rows.length} {t('inRange')}</span>
        <button
          onClick={exportToExcel}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', height: '30px', fontSize: '0.8rem', cursor: 'pointer' }}
          title={t('exportTitle')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('exportBtn')}
        </button>
        <button
          onClick={() => setFiltersOpen(true)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', height: '30px', fontSize: '0.8rem', cursor: 'pointer', position: 'relative' }}
        >
          <SlidersHorizontal size={13} />
          {t('filters')}
          {activeFilterCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
              background: 'var(--brand-500)', color: '#fff', fontSize: '0.62rem', fontWeight: 700,
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          <input className="form-input" style={{ paddingLeft: 32, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem' }}
            placeholder={t('searchGuestRoomPhone')} value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }} aria-label={t('clear')}><X size={14} /></button>}
        </div>
      </div>

      <FiltersModal s={s} open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </div>
  )
}
