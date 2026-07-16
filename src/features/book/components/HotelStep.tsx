'use client'

import { useTranslation } from '@/i18n'
import type { BookingWizard } from '../useBookingWizard'

// Slide: which hotel is this booking for? Only reachable when there's an
// actual choice — single-hotel admins are auto-scoped and skip this slide.
export function HotelStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const { hotels, selectedHotelId, chooseHotel } = w
  if (hotels.length <= 1) return null

  return (
    <div>
      <h2 className="mb-4">{t('whichHotel')}</h2>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {hotels.map(hotel => {
          const active = selectedHotelId === hotel._id
          return (
            <button
              key={hotel._id}
              type="button"
              onClick={() => chooseHotel(hotel._id)}
              className={`rounded-xl p-4 text-left cursor-pointer transition-all duration-150 border-2 ${
                active ? 'border-brand-500 bg-brand-500/[0.07]' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="font-bold text-[0.95rem] text-gray-800">{hotel.shortName}</div>
              {hotel.name && <div className="text-[0.75rem] text-gray-500 mt-0.5">{hotel.name}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
