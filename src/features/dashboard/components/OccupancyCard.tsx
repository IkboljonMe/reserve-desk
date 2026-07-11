'use client'

import { Gauge } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { DictionaryKeys } from '@/i18n'
import type { DashboardPageState } from '../useDashboardPage'

const DOW_KEYS: DictionaryKeys[] = ['dowSun', 'dowMon', 'dowTue', 'dowWed', 'dowThu', 'dowFri', 'dowSat']

const pct = (v: number) => `${Math.round(v * 100)}%`
const hrs = (min: number) => {
  const h = min / 60
  return Number.isInteger(h) ? String(h) : h.toFixed(1)
}

// Booked time vs. available time (open hours × capacity) for the period, per
// service, plus the overall figure and the busiest weekday.
export function OccupancyCard({ s }: { s: DashboardPageState }) {
  const { t } = useTranslation()
  const { occupancy: o } = s

  return (
    <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ display: 'inline-flex', color: 'var(--brand-600)' }}><Gauge size={17} /></span>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{t('occupancy')}</h3>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--gray-900)', fontVariantNumeric: 'tabular-nums' }}>{pct(o.overall)}</span>
          {o.peakDow !== null && (
            <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
              {t('busiest')}: <strong style={{ color: 'var(--gray-700)' }}>{t(DOW_KEYS[o.peakDow])}</strong>
            </span>
          )}
        </span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', margin: '0 0 0.9rem' }}>{t('occupancyHint')}</p>

      {o.perSvc.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: 0 }}>{t('noOccupancyData')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {o.perSvc.map(({ svc, util, bookedMin, availMin }) => (
            <div key={svc._id} className="dash-occ-row">
              <span className="dash-occ-name" style={{ fontSize: '0.8rem', color: 'var(--gray-700)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={svc.name}>
                {svc.name}
              </span>
              <div className="dash-occ-bar" style={{ height: 8, borderRadius: 6, background: 'var(--gray-100)', overflow: 'hidden' }}>
                <div style={{ width: pct(util), height: '100%', background: svc.color || 'var(--brand-500)', borderRadius: 6, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ width: 44, flexShrink: 0, textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-800)', fontVariantNumeric: 'tabular-nums' }}>{pct(util)}</span>
              <span className="dash-occ-hours" style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--gray-400)', fontVariantNumeric: 'tabular-nums' }}>
                {t('hoursBookedOfAvail', { booked: hrs(bookedMin), avail: hrs(availMin) })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
