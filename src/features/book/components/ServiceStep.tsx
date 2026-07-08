'use client'

import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { optionCardStyle } from '../styles'
import { BackButton } from './BackButton'
import type { BookingWizard } from '../useBookingWizard'

export function ServiceStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { hotelServices, selectedService, chooseService, setStep } = w

  return (
    <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
        <BackButton to={1} onBack={setStep} />
        <h2 style={{ margin: 0 }}>{t('chooseService')}</h2>
      </div>
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
  )
}
