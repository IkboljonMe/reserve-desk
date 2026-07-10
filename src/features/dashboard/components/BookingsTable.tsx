'use client'

import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { useTranslation } from '@/i18n'
import { svcId, bookingState, money } from '@/lib/bookingHelpers'
import { CalendarDays, ArrowUpDown, Check, BedDouble } from 'lucide-react'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { TYPE_META } from '../constants'
import type { DashboardPageState } from '../useDashboardPage'

export function BookingsTable({ s }: { s: DashboardPageState }) {
  const { t } = useTranslation()
  const { loading, rows, hotels, serviceHotel, sortKey, toggleSort, setDetailId } = s

  if (loading) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <tbody><SkeletonTableRows rows={6} columns={8} /></tbody>
      </table>
    )
  }
  if (rows.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '3rem' }}>
        <div className="empty-state-icon"><CalendarDays size={22} /></div>
        <p style={{ fontSize: '0.875rem' }}>{t('noBookingsMatch')}</p>
      </div>
    )
  }

  return (
    <div style={{ overflow: 'auto', maxHeight: 560 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, background: 'var(--gray-50)', zIndex: 1, borderBottom: '1px solid var(--gray-200)' }}>
            <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>{t('colDateTime')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'date' ? 1 : 0.3 }} /></th>
            <th className="dash-th">{t('service')}</th>
            <th className="dash-th">{t('hotel')}</th>
            <th className="dash-th">{t('guest')}</th>
            <th className="dash-th">{t('roomType')}</th>
            <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('price')}>{t('price')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'price' ? 1 : 0.3 }} /></th>
            <th className="dash-th">{t('status')}</th>
            <th className="dash-th" style={{ cursor: 'pointer' }} onClick={() => toggleSort('created')}>{t('created')} <ArrowUpDown size={11} style={{ opacity: sortKey === 'created' ? 1 : 0.3 }} /></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b, i) => {
            const st = bookingState(b)
            const hotel = hotels.find(h => h._id === (serviceHotel.get(svcId(b)) || ''))
            const type = b.bookingType || 'custom'
            return (
              <tr key={b._id} className="dash-row" onClick={() => setDetailId(b._id)}
                style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 ? 'var(--gray-50)' : '#fff', cursor: 'pointer', transition: 'background .1s' }}>
                <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{format(parseISO(b.date), 'MMM d')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{b.startTime}–{b.endTime}</div>
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.serviceId?.color || '#6366f1', flexShrink: 0 }} />
                    <span style={{ color: 'var(--gray-700)' }}>{b.serviceId?.name}</span>
                  </span>
                </td>
                <td style={{ padding: '9px 12px', color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: 600 }}>{hotel?.shortName || '—'}</td>
                <td style={{ padding: '9px 12px', color: 'var(--gray-800)', fontWeight: 500 }}>{b.customerName}</td>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {b.roomNumber ? <span style={{ color: 'var(--gray-600)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><BedDouble size={12} />{b.roomNumber}</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 6, background: `${TYPE_META[type].color}14`, color: TYPE_META[type].color, fontSize: '0.66rem', fontWeight: 700 }}>
                      {TYPE_META[type].icon}{t(TYPE_META[type].labelKey)}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '9px 12px', color: 'var(--gray-700)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {b.totalPrice > 0 ? `${money(b.totalPrice)}` : <span style={{ color: 'var(--gray-400)' }}>{t('free')}</span>}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: st.bg, color: st.color }}>
                    {st.key === 'finished' && <Check size={11} />}{st.label}
                  </span>
                </td>
                <td style={{ padding: '9px 12px', color: 'var(--gray-400)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
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
