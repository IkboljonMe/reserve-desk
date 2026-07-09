'use client'

import { useTranslation } from '@/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { TYPE_META } from '../constants'
import { chipStyle } from '../styles'
import { formatDuration, formatUZS } from '../utils'
import type { BookingWizard } from '../useBookingWizard'

// Context chips shown at the top of later steps.
export function ContextBar({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { selectedService, selectedHotelId, hotels, bookingType, categoryMeta, activePlan, selectedPlan, selectedVariant } = w
  if (!selectedService) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
      <span style={chipStyle('var(--gray-100)', 'var(--gray-600)')}>
        {hotels.find(h => h._id === selectedHotelId)?.shortName || t('hotel')}
      </span>
      <span style={chipStyle(`${selectedService.color}18`, selectedService.color)}>
        <span style={{ display: 'inline-flex' }}>{getServiceIcon(selectedService.name)}</span> {selectedService.name}
      </span>
      {selectedVariant && (
        <span style={chipStyle(`${selectedService.color}12`, selectedService.color)}>
          {selectedVariant.name}
        </span>
      )}
      {bookingType && (
        <span style={chipStyle(`${TYPE_META[bookingType].color}18`, TYPE_META[bookingType].color)}>
          {t(TYPE_META[bookingType].labelKey)}
        </span>
      )}
      {categoryMeta && (
        <span style={chipStyle(`${categoryMeta.color}18`, categoryMeta.color)}>
          {categoryMeta.label}
        </span>
      )}
      {activePlan && (bookingType === 'custom' || selectedPlan) && (
        <span style={chipStyle('var(--brand-50)', 'var(--brand-700)')}>
          {formatDuration(activePlan.duration)} · {activePlan.price > 0 ? `${formatUZS(activePlan.price)} ${t('sum')}` : t('isFree')}
        </span>
      )}
    </div>
  )
}
