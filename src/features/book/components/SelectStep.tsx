'use client'

import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { optionCardStyle } from '../styles'
import { PlanSection } from './PlanSection'
import { GuestSection } from './GuestSection'
import { DateTimeSection } from './DateTimeSection'
import type { BookingWizard } from '../useBookingWizard'

// Step 1: pick everything — hotel (owner only), service, who it's for, plan,
// guest/room details, and date & time. Sections reveal progressively as each
// prerequisite is filled in; there's no page-to-page navigation within this step.
export function SelectStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { hotels, selectedHotelId, chooseHotel, hotelServices, selectedService, chooseService, canReview, goToReview } = w

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Hotel — owners with more than one hotel only; admins are auto-scoped */}
      {hotels.length > 1 && (
        <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
          <h2 style={{ marginBottom: '1rem' }}>{t('whichHotel')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {hotels.map(hotel => (
              <button
                key={hotel._id}
                type="button"
                onClick={() => chooseHotel(hotel._id)}
                style={optionCardStyle(selectedHotelId === hotel._id, 'var(--brand-500)')}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-800)' }}>{hotel.shortName}</div>
                {hotel.name && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>{hotel.name}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service */}
      {selectedHotelId && (
        <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
          <h2 style={{ marginBottom: '1rem' }}>{t('chooseService')}</h2>
          {hotelServices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              </div>
              <h3>{t('noActiveServicesHotel')}</h3>
            </div>
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
      )}

      {selectedService && <PlanSection w={w} />}
      <GuestSection w={w} />
      <DateTimeSection w={w} />

      {canReview && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={goToReview}>{t('continueToReview')}</button>
        </div>
      )}
    </div>
  )
}
