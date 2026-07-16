'use client'

import { useTranslation } from '@/i18n'
import type { DictionaryKeys } from '@/i18n'
import type { SlideKey } from '../useBookingWizard'

const LABEL_KEYS: Record<SlideKey, DictionaryKeys> = {
  hotel: 'stepHotel',
  service: 'stepService',
  plan: 'stepPlan',
  guest: 'stepGuest',
  datetime: 'stepDateTime',
  review: 'stepReview',
}

export function SlideProgress({
  slides,
  slideIndex,
  onJump,
}: {
  slides: SlideKey[]
  slideIndex: number
  onJump: (key: SlideKey) => void
}) {
  const { t } = useTranslation()
  const current = slides[slideIndex]

  return (
    <div className="w-full">
      <div className="flex gap-1 mb-2">
        {slides.map((key, i) => {
          const done = i < slideIndex
          return (
            <div
              key={key}
              onClick={done ? () => onJump(key) : undefined}
              className="flex-1 h-1 rounded-sm transition-colors duration-200"
              style={{
                background: i <= slideIndex ? 'var(--brand-500)' : 'var(--gray-200)',
                cursor: done ? 'pointer' : 'default',
              }}
            />
          )
        })}
      </div>
      <div className="text-[0.72rem] font-semibold text-gray-400">
        {t('stepOfN', { current: slideIndex + 1, total: slides.length })}
        {' · '}
        <span className="text-gray-700">{current ? t(LABEL_KEYS[current]) : ''}</span>
      </div>
    </div>
  )
}
