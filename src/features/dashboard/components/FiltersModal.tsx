'use client'

import { X, Wallet, Building2, Layers, CheckCircle2, Tag } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Dropdown from '@/components/ui/Dropdown'
import type { PaymentFilter, TypeFilter, StateFilter } from '../utils'
import type { DashboardPageState } from '../useDashboardPage'
import { FilterGroup } from './FilterGroup'
import Button from '@/components/ui/Button'

export function FiltersModal({ s, open, onClose }: { s: DashboardPageState; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const {
    hotels, services,
    fHotels, setFHotels, fServices, setFServices, allHotelsOn, allServicesOn,
    fPayment, setFPayment, fType, setFType, fState, setFState, activeFilterCount, clearFilters,
  } = s

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2>{t('filters')}</h2>
          <Button variant="ghost" icon onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* 1. Hotels */}
          {hotels.length > 1 && (
            <FilterGroup icon={<Building2 size={12} />} label={t('hotel')}>
              <button className={`dash-pill ${allHotelsOn ? 'active' : ''}`} onClick={() => setFHotels(new Set())}>{t('all')}</button>
              {hotels.map(h => (
                <button key={h._id} className={`dash-pill ${fHotels.has(h._id) ? 'active' : ''}`}
                  onClick={() => setFHotels(prev => { const n = new Set(prev); if (n.has(h._id)) n.delete(h._id); else n.add(h._id); return n })}>{h.shortName}</button>
              ))}
            </FilterGroup>
          )}

          {/* 2. Payment */}
          <FilterGroup icon={<Wallet size={12} />} label={t('payment')}>
            <Dropdown
              value={fPayment}
              onChange={val => setFPayment(val as PaymentFilter)}
              options={[
                { value: 'all', label: t('allPayments') },
                { value: 'paid', label: t('paid') },
                { value: 'unpaid', label: t('unpaid') },
                { value: 'free', label: t('free') },
              ]}
            />
          </FilterGroup>

          {/* 3. Type */}
          <FilterGroup icon={<Layers size={12} />} label={t('type')}>
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
          </FilterGroup>

          {/* 4. Status */}
          <FilterGroup icon={<CheckCircle2 size={12} />} label={t('status')}>
            <Dropdown
              value={fState}
              onChange={val => setFState(val as StateFilter)}
              options={[
                { value: 'all', label: t('allStates') },
                { value: 'active', label: t('active') },
                { value: 'finished', label: t('finished') },
              ]}
            />
          </FilterGroup>

          {/* 5. Services */}
          {services.length > 1 && (
            <FilterGroup icon={<Tag size={12} />} label={t('services')}>
              <button className={`dash-pill ${allServicesOn ? 'active' : ''}`} onClick={() => setFServices(new Set())}>{t('allServices')}</button>
              {services.map(svc => (
                <button key={svc._id} className="dash-pill" style={fServices.has(svc._id) ? { background: svc.color, color: '#fff', borderColor: 'transparent' } : {}}
                  onClick={() => setFServices(prev => { const n = new Set(prev); if (n.has(svc._id)) n.delete(svc._id); else n.add(svc._id); return n })}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: fServices.has(svc._id) ? '#fff' : svc.color }} />{svc.name}
                </button>
              ))}
            </FilterGroup>
          )}
        </div>

        <div className="h-px bg-surface-border my-4" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Button type="button" variant="ghost" disabled={activeFilterCount === 0} onClick={clearFilters}>
            {t('clear')}
          </Button>
          <Button type="button" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
