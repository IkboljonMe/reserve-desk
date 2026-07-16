'use client'

import { Search, Plus, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { extractHotelId } from '../utils'
import { ServiceCard } from './ServiceCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ServicesPageState } from '../useServicesPage'
import Button from '@/components/ui/Button'

export function ServicesGrid({ s }: { s: ServicesPageState }) {
  const { t } = useTranslation()
  const {
    loading, services, filtered, filterHotel, hotels, hotelMap, resolveGroupMeta,
    openAddForm, openEditForm, toggleActive, deleteConfirm, setDeleteConfirm, handleDelete,
    setSearchQuery, setFilterHotel, setFilterStatus,
  } = s

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }
  if (services.length === 0) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-0 overflow-hidden">
        <EmptyState icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        }>
          <h3 className="text-gray-700">{t('noServicesTitle')}</h3>
          <p>{t('noServicesDesc')}</p>
          <Button className="mt-2" onClick={openAddForm}>
            <Plus size={15} /> {t('addService')}
          </Button>
        </EmptyState>
      </div>
    )
  }
  if (filtered.length === 0) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-0 overflow-hidden">
        <EmptyState icon={<Search size={26} />}>
          <h3 className="text-gray-700">{t('noResults')}</h3>
          <p>{t('noServicesMatch')}</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => { setSearchQuery(''); setFilterHotel(''); setFilterStatus('') }}>
            {t('clearFilters')}
          </Button>
        </EmptyState>
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
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
            <div key={hotel._id} className="mb-8">
              {/* Hotel group header */}
              <div className="flex items-center gap-2.5 mb-3.5">
                <span className="inline-flex items-center justify-center min-w-[38px] h-7 px-2 rounded-md bg-[var(--brand-500,#6366f1)] text-white font-bold text-[0.75rem] tracking-wide shrink-0">
                  {hotel.shortName || hotel.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="font-bold text-[0.9375rem] text-[var(--gray-700)]">
                  {hotel.name}
                </span>
                <ChevronRight size={14} className="text-[var(--gray-300)]" />
                <span className="text-[0.75rem] text-[var(--gray-400)] tabular-nums">
                  {hotelServices.length} {hotelServices.length === 1 ? t('serviceOne') : t('servicesWord')}
                </span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {hotelServices.map(svc => (
                  <ServiceCard key={svc._id} {...cardProps(svc, undefined)} />
                ))}
              </div>
              {/* Show unassigned only once, after last hotel group */}
              {hotel._id === hotels[hotels.length - 1]._id && unassigned.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="font-bold text-[0.8125rem] text-[var(--warning,#f59e0b)]">{t('unassigned')}</span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
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
