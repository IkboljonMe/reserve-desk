'use client'

import { BedDouble } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { optionCardStyle } from '../styles'
import type { BookingWizard } from '../useBookingWizard'

export function HotelStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { hotels, selectedHotelId, chooseHotel } = w

  return (
    <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <h2 style={{ marginBottom: '1rem' }}>{t('chooseHotel')}</h2>
      {hotels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BedDouble size={24} /></div>
          <h3>{t('noHotelsFound')}</h3>
        </div>
      ) : (
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
      )}
    </div>
  )
}
