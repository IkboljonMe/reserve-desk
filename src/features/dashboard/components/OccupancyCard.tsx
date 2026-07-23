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
    <div className="card p-[1.1rem_1.25rem]">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex text-brand-600"><Gauge size={17} /></span>
        <h3 className="m-0 text-[0.95rem]">{t('occupancy')}</h3>
        <span className="ml-auto flex items-baseline gap-2.5">
          <span className="font-[800] text-[1.15rem] text-gray-900 tabular-nums">{pct(o.overall)}</span>
          {o.peakDow !== null && (
            <span className="text-[0.72rem] text-gray-500">
              {t('busiest')}: <strong className="text-gray-700">{t(DOW_KEYS[o.peakDow])}</strong>
            </span>
          )}
        </span>
      </div>
      <p className="text-[0.72rem] text-gray-400 m-0 mb-[0.9rem]">{t('occupancyHint')}</p>

      {o.perSvc.length === 0 ? (
        <p className="text-[0.8rem] text-gray-400 m-0">{t('noOccupancyData')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {o.perSvc.map(({ svc, util, bookedMin, availMin }) => (
            <div key={svc._id} className="flex items-center gap-3 flex-wrap">
              {/* name */}
              <span
                className="text-[0.8rem] text-gray-700 font-semibold overflow-hidden text-ellipsis whitespace-nowrap w-32.5 shrink-0 max-[480px]:w-full"
                title={svc.name}
              >
                {svc.name}
              </span>
              {/* bar */}
              <div className="flex-1 basis-[100px] min-w-20 h-2 bg-gray-100 overflow-hidden">
                <div
                  className="h-full transition-[width] duration-400 ease-out"
                  style={{ width: pct(util), background: svc.color || 'var(--brand-500)' }}
                />
              </div>
              {/* pct */}
              <span className="w-11 shrink-0 text-right text-[0.78rem] font-bold text-gray-800 tabular-nums">{pct(util)}</span>
              {/* hours */}
              <span className="w-23 shrink-0 text-right text-[0.72rem] text-gray-400 tabular-nums max-[480px]:hidden">
                {t('hoursBookedOfAvail', { booked: hrs(bookedMin), avail: hrs(availMin) })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
