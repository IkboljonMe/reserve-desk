'use client'

import { Search, X } from 'lucide-react'
import Dropdown from '@/components/ui/Dropdown'
import { useTranslation } from '@/i18n'
import type { StatusFilter } from '../constants'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarFilters({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const { search, setSearch, statusFilter, setStatusFilter } = s

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: '0.82rem', borderRadius: 8 }}
          placeholder={t('searchGuestRoomPhone')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 2 }} aria-label={t('clearSearch')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ minWidth: 140 }}>
        <Dropdown
          value={statusFilter}
          onChange={val => setStatusFilter(val as StatusFilter)}
          options={[
            { value: 'all', label: t('allStatuses') },
            { value: 'unpaid', label: t('unpaid') },
            { value: 'paid', label: t('paid') },
            { value: 'finished', label: t('finished') },
          ]}
        />
      </div>
    </div>
  )
}
