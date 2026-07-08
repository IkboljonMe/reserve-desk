'use client'

import { Search, X, Wallet, Building2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Dropdown from '@/components/ui/Dropdown'
import type { PaymentFilter, TypeFilter, StateFilter } from '../utils'
import type { DashboardPageState } from '../useDashboardPage'
import { FilterGroup } from './FilterGroup'

export function BookingsToolbar({ s }: { s: DashboardPageState }) {
  const { t } = useTranslation()
  const {
    rows, exportToExcel, search, setSearch, hotels, services,
    fHotels, setFHotels, fServices, setFServices, allHotelsOn, allServicesOn,
    fPayment, setFPayment, fType, setFType, fState, setFState, activeFilterCount, clearFilters,
  } = s

  return (
    <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '0.95rem', margin: 0, marginRight: 4 }}>{t('bookings')}</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, marginRight: 8 }}>{rows.length} {t('inRange')}</span>
        <button
          onClick={exportToExcel}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', height: '30px', fontSize: '0.8rem', cursor: 'pointer' }}
          title={t('exportTitle')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t('exportBtn')}
        </button>
        <div style={{ position: 'relative', marginLeft: 'auto', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
          <input className="form-input" style={{ paddingLeft: 32, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem' }}
            placeholder={t('searchGuestRoomPhone')} value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }} aria-label={t('clear')}><X size={14} /></button>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Hotels */}
        {hotels.length > 1 && (
          <FilterGroup icon={<Building2 size={12} />} label={t('hotel')}>
            <button className={`dash-pill ${allHotelsOn ? 'active' : ''}`} onClick={() => setFHotels(new Set())}>{t('all')}</button>
            {hotels.map(h => (
              <button key={h._id} className={`dash-pill ${fHotels.has(h._id) ? 'active' : ''}`}
                onClick={() => setFHotels(prev => { const n = new Set(prev); if (n.has(h._id)) n.delete(h._id); else n.add(h._id); return n })}>{h.shortName}</button>
            ))}
          </FilterGroup>
        )}
        {/* Payment */}
        <div style={{ minWidth: 140 }}>
          <Dropdown
            value={fPayment}
            onChange={val => setFPayment(val as PaymentFilter)}
            options={[
              { value: 'all', label: t('allPayments') },
              { value: 'paid', label: t('paid') },
              { value: 'unpaid', label: t('unpaid') },
              { value: 'free', label: t('free') },
            ]}
            icon={<Wallet size={12} />}
          />
        </div>

        {/* Type */}
        <div style={{ minWidth: 120 }}>
          <Dropdown
            value={fType}
            onChange={val => setFType(val as TypeFilter)}
            options={[
              { value: 'all', label: t('allTypes') },
              { value: 'client', label: t('typeClient') },
              { value: 'room', label: t('typeRoom') },
              { value: 'custom', label: t('typeCustom') },
            ]}
          />
        </div>

        {/* State */}
        <div style={{ minWidth: 120 }}>
          <Dropdown
            value={fState}
            onChange={val => setFState(val as StateFilter)}
            options={[
              { value: 'all', label: t('allStates') },
              { value: 'active', label: t('active') },
              { value: 'finished', label: t('finished') },
            ]}
          />
        </div>
        {activeFilterCount > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}
            onClick={clearFilters}>
            <X size={13} /> {t('clear')}
          </button>
        )}
      </div>

      {/* Service chips */}
      {services.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`dash-pill ${allServicesOn ? 'active' : ''}`} onClick={() => setFServices(new Set())}>{t('allServices')}</button>
          {services.map(svc => (
            <button key={svc._id} className="dash-pill" style={fServices.has(svc._id) ? { background: svc.color, color: '#fff', borderColor: 'transparent' } : {}}
              onClick={() => setFServices(prev => { const n = new Set(prev); if (n.has(svc._id)) n.delete(svc._id); else n.add(svc._id); return n })}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: fServices.has(svc._id) ? '#fff' : svc.color }} />{svc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
