'use client'

import React from 'react'
import { Service, money } from '@/lib/bookingHelpers'
import { useCountUp } from '@/hooks/useCountUp'
import { useTranslation } from '@/i18n'
import { Skeleton } from '@/components/ui/Skeleton'
import DashboardKpi from './DashboardKpi'
import IncomeChart from './IncomeChart'

interface IncomeAnalyticsProps {
  analytics: {
    data: { label: string; expected: number; collected: number; count: number }[]
    byWeek: boolean
    total: number
    collected: number
    due: number
    count: number
  }
  loading: boolean
  perService: { svc: Service; total: number }[]
}

const INK_COLLECTED = '#059669'   // darker green for ink/stroke (contrast relief)
const FILL_COLLECTED = '#10b981'  // green fill
const EXPECTED = '#6366f1'        // indigo (brand)

export default function IncomeAnalytics({ analytics, loading, perService }: IncomeAnalyticsProps) {
  const { t } = useTranslation()
  const total = useCountUp(analytics.total)
  const collected = useCountUp(analytics.collected)
  const due = useCountUp(analytics.due)
  const count = useCountUp(analytics.count)

  return (
    <div className="dash-analytics-grid">
      <div style={{ minWidth: 0 }}>
        {/* KPI strip */}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: '1.1rem' }}>
          <DashboardKpi label={t('totalIncome')} value={`${money(total)}`} unit={t('sum')} color="var(--gray-900)" />
          <DashboardKpi label={t('collected')} value={`${money(collected)}`} unit={t('sum')} color={INK_COLLECTED} dot={FILL_COLLECTED} />
          <DashboardKpi label={t('outstanding')} value={`${money(due)}`} unit={t('sum')} color="#b45309" dot="#f59e0b" />
          <DashboardKpi label={t('bookings')} value={`${Math.round(count)}`} color={EXPECTED} />
        </div>
        {/* Chart */}
        {loading ? (
          <Skeleton style={{ height: 200 }} />
        ) : (
          <IncomeChart key={`${analytics.data.length}-${analytics.total}`} data={analytics.data} />
        )}
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: FILL_COLLECTED }} /> {t('collected')}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: `${EXPECTED}33`, border: `1.5px solid ${EXPECTED}` }} /> {t('expectedBooked')}
          </span>
        </div>
      </div>

      {/* Income by service */}
      <div className="dash-analytics-side">
        <h3 style={{ fontSize: '0.8rem', margin: '0 0 0.9rem' }}>{t('incomeByService')}</h3>
        {perService.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{t('noIncomeInPeriod')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {perService.slice(0, 6).map(({ svc, total: svcTotal }) => {
              const pct = analytics.total > 0 ? (svcTotal / analytics.total) * 100 : 0
              return (
                <div key={svc._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--gray-700)', overflow: 'hidden' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: svc.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.name}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)', fontVariantNumeric: 'tabular-nums' }}>{money(svcTotal)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: svc.color, width: `${pct}%`, transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
