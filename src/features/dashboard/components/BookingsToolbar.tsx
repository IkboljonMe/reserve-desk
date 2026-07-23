'use client'

import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { DashboardPageState } from '../useDashboardPage'
import { FiltersModal } from './FiltersModal'
import Button from '@/components/ui/Button'

export function BookingsToolbar({ s }: { s: DashboardPageState }) {
  const { t } = useTranslation()
  const { rows, exportToExcel, search, setSearch, activeFilterCount } = s
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="px-[1.1rem] py-[0.9rem] border-b border-surface-border flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5 flex-wrap">
        <h3 className="text-[0.95rem] m-0 mr-1">{t('bookings')}</h3>
        <span className="text-[0.75rem] text-gray-400 font-semibold mr-2">{rows.length} {t('inRange')}</span>
        <Button
          onClick={exportToExcel}
          variant="secondary" size="sm"
          className="flex items-center gap-1.5 px-2.5 py-1.25 h-7.5 text-[0.8rem] cursor-pointer"
          title={t('exportTitle')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('exportBtn')}
        </Button>
        <Button
          onClick={() => setFiltersOpen(true)}
          variant="secondary" size="sm"
          className="flex items-center gap-1.5 px-2.5 py-1.25 h-7.5 text-[0.8rem] cursor-pointer relative"
        >
          <SlidersHorizontal size={13} />
          {t('filters')}
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-lg bg-brand-500 text-white text-[0.62rem] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <div className="relative ml-auto flex-[1_1_220px] max-w-80">
          <Search size={14} className="absolute left-2.75 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="form-input pl-8 py-1.5 text-[0.82rem]"
            placeholder={t('searchGuestRoomPhone')} value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-gray-400" aria-label={t('clear')}><X size={14} /></button>}
        </div>
      </div>

      <FiltersModal s={s} open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </div>
  )
}
