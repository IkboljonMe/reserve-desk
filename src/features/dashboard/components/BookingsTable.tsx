'use client'

import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { useTranslation } from '@/i18n'
import { svcId, bookingState, money } from '@/lib/bookingHelpers'
import { CalendarDays, ArrowUpDown, Check, BedDouble } from 'lucide-react'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { TYPE_META } from '../constants'
import type { DashboardPageState } from '../useDashboardPage'

// Reusable TH class replacing the .dash-th CSS class
const TH = 'p-[9px_12px] text-left font-bold text-gray-500 text-[0.7rem] uppercase tracking-[0.04em] whitespace-nowrap select-none'

export function BookingsTable({ s }: { s: DashboardPageState }) {
  const { t } = useTranslation()
  const { loading, rows, hotels, serviceHotel, sortKey, toggleSort, setDetailId } = s

  if (loading) {
    return (
      <table className="w-full border-collapse text-[0.8125rem]">
        <tbody><SkeletonTableRows rows={6} columns={8} /></tbody>
      </table>
    )
  }
  if (rows.length === 0) {
    return (
      <EmptyState icon={<CalendarDays size={22} />} style={{ padding: '3rem' }}>
        <p className="text-sm">{t('noBookingsMatch')}</p>
      </EmptyState>
    )
  }

  return (
    <div className="overflow-auto max-h-140">
      <table className="w-full border-collapse text-[0.8125rem]">
        <thead>
          <tr className="sticky top-0 bg-gray-50 z-[1] border-b border-gray-200">
            <th className={`${TH} cursor-pointer`} onClick={() => toggleSort('date')}>
              <span className="inline-flex items-center gap-1">{t('colDateTime')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'date' ? 1 : 0.3 }} /></span>
            </th>
            <th className={TH}>{t('service')}</th>
            <th className={TH}>{t('hotel')}</th>
            <th className={TH}>{t('guest')}</th>
            <th className={TH}>{t('roomType')}</th>
            <th className={`${TH} cursor-pointer`} onClick={() => toggleSort('price')}>
              <span className="inline-flex items-center gap-1">{t('price')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'price' ? 1 : 0.3 }} /></span>
            </th>
            <th className={TH}>{t('status')}</th>
            <th className={`${TH} cursor-pointer`} onClick={() => toggleSort('created')}>
              <span className="inline-flex items-center gap-1">{t('created')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'created' ? 1 : 0.3 }} /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b, i) => {
            const st = bookingState(b)
            const hotel = hotels.find(h => h._id === (serviceHotel.get(svcId(b)) || ''))
            const type = b.bookingType || 'custom'
            return (
              <tr
                key={b._id}
                onClick={() => setDetailId(b._id)}
                className="border-b border-gray-100 cursor-pointer transition-colors duration-100 hover:bg-brand-50"
                style={{ background: i % 2 ? 'var(--gray-50)' : '#fff' }}
              >
                <td className="p-[9px_12px] whitespace-nowrap">
                  <div className="font-semibold text-gray-800">{format(parseISO(b.date), 'MMM d')}</div>
                  <div className="text-[0.72rem] text-gray-400">{b.startTime}–{b.endTime}</div>
                </td>
                <td className="p-[9px_12px]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.serviceId?.color || '#6366f1' }} />
                    <span className="text-gray-700">{b.serviceId?.name}</span>
                  </span>
                </td>
                <td className="p-[9px_12px] text-gray-500 text-[0.75rem] font-semibold">{hotel?.shortName || '—'}</td>
                <td className="p-[9px_12px] text-gray-800 font-medium">{b.customerName}</td>
                <td className="p-[9px_12px]">
                  <div className="flex items-center gap-1.5">
                    {b.roomNumber ? <span className="text-gray-600 inline-flex items-center gap-0.75"><BedDouble size={12} />{b.roomNumber}</span> : <span className="text-gray-300">—</span>}
                    <span
                      className="inline-flex items-center gap-0.75 px-1.5 py-0.25 text-[0.66rem] font-bold"
                      style={{ background: `${TYPE_META[type].color}14`, color: TYPE_META[type].color }}
                    >
                      {TYPE_META[type].icon}{t(TYPE_META[type].labelKey)}
                    </span>
                  </div>
                </td>
                <td className="p-[9px_12px] text-gray-700 whitespace-nowrap tabular-nums">
                  {b.totalPrice > 0 ? `${money(b.totalPrice)}` : <span className="text-gray-400">{t('free')}</span>}
                </td>
                <td className="p-[9px_12px]">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.7rem] font-bold"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.key === 'finished' && <Check size={11} />}{t(st.key)}
                  </span>
                </td>
                <td className="p-[9px_12px] text-gray-400 text-[0.72rem] whitespace-nowrap">
                  {b.createdAt ? formatDistanceToNow(parseISO(b.createdAt), { addSuffix: true }) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
