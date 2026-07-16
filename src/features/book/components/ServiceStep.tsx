'use client'

import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { EmptyState } from '@/components/ui/EmptyState'
import { optionCardStyle } from '../styles'
import type { BookingWizard } from '../useBookingWizard'

// Slide: which service is this booking for?
export function ServiceStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { selectedHotelId, hotelServices, selectedService, chooseService } = w
  if (!selectedHotelId) return null

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>{t('chooseService')}</h2>
      {hotelServices.length === 0 ? (
        <EmptyState icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}>
          <h3 className="text-gray-700">{t('noActiveServicesHotel')}</h3>
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {hotelServices.map(svc => (
            <button
              key={svc._id}
              type="button"
              onClick={() => chooseService(svc)}
              style={optionCardStyle(selectedService?._id === svc._id, svc.color)}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 10,
                background: `${svc.color}18`, color: svc.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {getServiceIcon(svc.name)}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', marginBottom: 2 }}>{svc.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                {(svc.pricingGroups?.length ?? 0) > 0
                  ? (svc.pricingGroups!.length === 1
                    ? t('categoryPriced', { count: svc.pricingGroups!.length })
                    : t('categoriesPriced', { count: svc.pricingGroups!.length }))
                  : svc.isFree ? t('isFree') : t('customPricing')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
