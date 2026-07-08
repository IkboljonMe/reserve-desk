'use client'

import { Search, Plus, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { extractHotelId } from '../utils'
import { ServiceCard } from './ServiceCard'
import type { ServicesPageState } from '../useServicesPage'

export function ServicesGrid({ s }: { s: ServicesPageState }) {
  const { t } = useTranslation()
  const {
    loading, services, filtered, filterHotel, hotels, hotelMap, resolveGroupMeta,
    openAddForm, openEditForm, toggleActive, deleteConfirm, setDeleteConfirm, handleDelete,
    setSearchQuery, setFilterHotel, setFilterStatus,
  } = s

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
      </div>
    )
  }
  if (services.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h3>{t('noServicesTitle')}</h3>
          <p>{t('noServicesDesc')}</p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAddForm}>
            <Plus size={15} /> {t('addService')}
          </button>
        </div>
      </div>
    )
  }
  if (filtered.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search size={26} />
          </div>
          <h3>{t('noResults')}</h3>
          <p>{t('noServicesMatch')}</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => { setSearchQuery(''); setFilterHotel(''); setFilterStatus('') }}>
            {t('clearFilters')}
          </button>
        </div>
      </div>
    )
  }

  const cardProps = (svc: Parameters<typeof openEditForm>[0], hotelName: string | undefined) => ({
    svc,
    hotelName,
    onEdit: () => openEditForm(svc),
    onToggleActive: () => toggleActive(svc),
    onDeleteRequest: () => setDeleteConfirm(svc._id),
    onDeleteConfirm: () => handleDelete(svc._id),
    onDeleteCancel: () => setDeleteConfirm(null),
    deleteConfirm: deleteConfirm === svc._id,
    groupMeta: resolveGroupMeta,
  })

  // When a single hotel is selected, show a flat grid.
  if (filterHotel) {
    return (
      <div className="services-grid">
        {filtered.map(svc => (
          <ServiceCard key={svc._id} {...cardProps(svc, hotelMap.get(extractHotelId(svc.hotelId))?.name)} />
        ))}
      </div>
    )
  }

  // Otherwise group by hotel.
  return (
    <>
      {hotels
        .filter(h => filtered.some(svc => extractHotelId(svc.hotelId) === h._id))
        .map(hotel => {
          const hotelServices = filtered.filter(svc => extractHotelId(svc.hotelId) === hotel._id)
          const unassigned = filtered.filter(svc => { const hid = extractHotelId(svc.hotelId); return !hid || !hotelMap.has(hid) })
          return (
            <div key={hotel._id} style={{ marginBottom: '2rem' }}>
              {/* Hotel group header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 38, height: 28, padding: '0 8px', borderRadius: 8,
                  background: 'var(--brand-500)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em',
                }}>
                  {hotel.shortName || hotel.name.slice(0, 2).toUpperCase()}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-700)' }}>
                  {hotel.name}
                </span>
                <ChevronRight size={14} style={{ color: 'var(--gray-300)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }} className="tabular-nums">
                  {hotelServices.length} {hotelServices.length === 1 ? t('serviceOne') : t('servicesWord')}
                </span>
              </div>
              <div className="services-grid">
                {hotelServices.map(svc => (
                  <ServiceCard key={svc._id} {...cardProps(svc, undefined)} />
                ))}
              </div>
              {/* Show unassigned only once, after last hotel group */}
              {hotel._id === hotels[hotels.length - 1]._id && unassigned.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--warning)' }}>{t('unassigned')}</span>
                  </div>
                  <div className="services-grid">
                    {unassigned.map(svc => (
                      <ServiceCard key={svc._id} {...cardProps(svc, undefined)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
    </>
  )
}
