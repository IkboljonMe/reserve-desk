'use client'

import React from 'react'
import { Service, money } from '@/lib/bookingHelpers'
import { useCountUp } from '@/hooks/useCountUp'
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
  const total = useCountUp(analytics.total)
  const collected = useCountUp(analytics.collected)
  const due = useCountUp(analytics.due)
  const count = useCountUp(analytics.count)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: '1.5rem', alignItems: 'stretch' }}>
      <div style={{ minWidth: 0 }}>
        {/* KPI strip */}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: '1.1rem' }}>
          <DashboardKpi label="Total income" value={`${money(total)}`} unit="UZS" color="var(--gray-900)" />
          <DashboardKpi label="Collected" value={`${money(collected)}`} unit="UZS" color={INK_COLLECTED} dot={FILL_COLLECTED} />
          <DashboardKpi label="Outstanding" value={`${money(due)}`} unit="UZS" color="#b45309" dot="#f59e0b" />
          <DashboardKpi label="Bookings" value={`${Math.round(count)}`} color={EXPECTED} />
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
            <span style={{ width: 12, height: 12, borderRadius: 3, background: FILL_COLLECTED }} /> Collected
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: `${EXPECTED}33`, border: `1.5px solid ${EXPECTED}` }} /> Expected (booked)
          </span>
        </div>
      </div>

      {/* Income by service */}
      <div style={{ borderLeft: '1px solid var(--surface-border)', paddingLeft: '1.4rem' }}>
        <h3 style={{ fontSize: '0.8rem', margin: '0 0 0.9rem' }}>Income by service</h3>
        {perService.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>No income in this period</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {perService.slice(0, 6).map(({ svc, total: t }) => {
              const pct = analytics.total > 0 ? (t / analytics.total) * 100 : 0
              return (
                <div key={svc._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--gray-700)', overflow: 'hidden' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: svc.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.name}</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)', fontVariantNumeric: 'tabular-nums' }}>{money(t)}</span>
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
