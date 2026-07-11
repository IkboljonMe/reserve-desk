'use client'

import { useTranslation } from '@/i18n'
import { optionCardStyle } from '../styles'
import type { BookingWizard } from '../useBookingWizard'

// Slide: which hotel is this booking for? Only reachable when there's an
// actual choice — single-hotel admins are auto-scoped and skip this slide.
export function HotelStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { hotels, selectedHotelId, chooseHotel } = w
  if (hotels.length <= 1) return null

  return (
    <div>
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
  )
}
