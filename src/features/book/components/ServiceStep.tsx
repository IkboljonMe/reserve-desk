'use client'

import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { EmptyState } from '@/components/ui/EmptyState'
import type { BookingWizard } from '../useBookingWizard'

// Slide: which service is this booking for?
export function ServiceStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { selectedHotelId, hotelServices, selectedService, chooseService } = w
  if (!selectedHotelId) return null

  return (
    <div>
      <h2 className="mb-4">{t('chooseService')}</h2>
      {hotelServices.length === 0 ? (
        <EmptyState icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}>
          <h3 className="text-gray-700">{t('noActiveServicesHotel')}</h3>
        </EmptyState>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {hotelServices.map(svc => {
            const active = selectedService?._id === svc._id
            return (
              <button
                key={svc._id}
                type="button"
                onClick={() => chooseService(svc)}
                className={`rounded-xl p-4 text-left cursor-pointer transition-all duration-150 border-2 ${
                  active ? 'border-current' : 'border-gray-200 bg-white'
                }`}
                style={{
                  borderColor: active ? svc.color : undefined,
                  background: active ? `${svc.color}12` : undefined,
                }}
              >
                <div
                  className="w-10 h-10 rounded-[10px] mb-2.5 flex items-center justify-center"
                  style={{ background: `${svc.color}18`, color: svc.color }}
                >
                  {getServiceIcon(svc.name)}
                </div>
                <div className="font-semibold text-[0.9rem] text-gray-800 mb-0.5">{svc.name}</div>
                <div className="text-[0.72rem] text-gray-400">
                  {(svc.pricingGroups?.length ?? 0) > 0
                    ? (svc.pricingGroups!.length === 1
                      ? t('categoryPriced', { count: svc.pricingGroups!.length })
                      : t('categoriesPriced', { count: svc.pricingGroups!.length }))
                    : svc.isFree ? t('isFree') : t('customPricing')}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
