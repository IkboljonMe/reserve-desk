'use client'

import { Search, X } from 'lucide-react'
import Dropdown from '@/components/ui/Dropdown'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { StatusFilter } from '../constants'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarFilters({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { search, setSearch, statusFilter, setStatusFilter } = s

  return (
    <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
      <div className="relative flex-[1_1_220px] min-w-[180px]">
        <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[var(--gray-400)] pointer-events-none" />
        <input
          className="w-full pl-8 py-1.75 text-[0.82rem] rounded-lg border-1.5 border-[var(--gray-200,#e5e7eb)] outline-none bg-white text-[var(--gray-800)] hover:border-[var(--gray-300)] focus:border-[var(--brand-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          placeholder={t('searchGuestRoomPhone')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[var(--gray-400)] p-0.5" aria-label={t('clearSearch')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* On mobile this dropdown moves up into CalendarToolbar's compact stack, next to view/density. */}
      {!isMobile && (
        <div className="min-w-[140px]">
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
      )}
    </div>
  )
}
