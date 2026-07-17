'use client'

import { Wallet } from 'lucide-react'
import { money } from '@/lib/bookingHelpers'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import { HotelFilterList, ServiceFilterList } from './CalendarFilterLists'
import type { CalendarPageState } from '../useCalendarPage'

export function CalendarSidebar({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { summary, view } = s

  return (
    <div className="cal-sidebar">
      {/* Range summary */}
      <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-[0.9rem_1rem]">
        <div className="flex justify-between mb-2">
          <div>
            <div className="text-2xl font-extrabold text-[var(--gray-800)] leading-none">{summary.count}</div>
            <div className="text-[0.7rem] text-[var(--gray-400)] uppercase tracking-wider mt-0.5">{t('bookings')}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-[var(--brand-600)] leading-none">{money(summary.revenue)}</div>
            <div className="text-[0.7rem] text-[var(--gray-400)] uppercase tracking-wider mt-0.5">{t('sum')} · {view === 'day' ? t('day') : view === 'week' ? t('periodWeek') : t('periodMonth')}</div>
          </div>
        </div>
        {summary.revenue > 0 && (
          <div className="flex items-center gap-1.5 text-[0.72rem] text-[var(--gray-500)] border-t border-dashed border-[var(--gray-200)] pt-2">
            <Wallet size={13} className="text-emerald-500" />
            <span className="font-bold text-emerald-600">{money(summary.collected)}</span> {t('collected')}
            {summary.collected < summary.revenue && (
              <span className="ml-auto font-bold text-amber-600">{money(summary.revenue - summary.collected)} {t('due')}</span>
            )}
          </div>
        )}
      </div>

      {/* Hotel & service filters — desktop only. On mobile they live in the
          filter modal, so the sidebar shows just the summary numbers on top. */}
      {!isMobile && (
        <>
          <HotelFilterList s={s} />
          <ServiceFilterList s={s} />
        </>
      )}
    </div>
  )
}
