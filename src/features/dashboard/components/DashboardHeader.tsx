'use client'

import { format } from 'date-fns'
import { nowUZ } from '@/lib/timezone'
import { useTranslation } from '@/i18n'
import { Plus } from 'lucide-react'
import type { PeriodKey } from '../utils'
import type { DashboardPageState } from '../useDashboardPage'

export function DashboardHeader({ s }: { s: DashboardPageState }) {
  const { t, lang } = useTranslation()
  const { period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo, router } = s

  return (
    <div className="page-header" style={{ marginBottom: 0 }}>
      <div>
        <h1>{t('dashboard')}</h1>
        <p style={{ marginTop: 4 }}>{format(nowUZ(), 'EEEE, MMMM d, yyyy')}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="dash-seg">
          {([['week', t('periodWeek')], ['month', t('periodMonth')], ['7d', '7d'], ['30d', '30d'], ['custom', t('periodCustom')]] as [PeriodKey, string][]).map(([k, l]) => (
            <button key={k} className={period === k ? 'active' : ''} onClick={() => setPeriod(k)}>{l}</button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="date" className="form-input" style={{ padding: '5px 8px', fontSize: '0.8rem' }} value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} />
            <span style={{ color: 'var(--gray-400)' }}>–</span>
            <input type="date" className="form-input" style={{ padding: '5px 8px', fontSize: '0.8rem' }} value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)} />
          </div>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => router.push(`/${lang}/book?date=${format(nowUZ(), 'yyyy-MM-dd')}`)}>
          <Plus size={14} strokeWidth={2.5} /> {t('newBooking')}
        </button>
      </div>
    </div>
  )
}
