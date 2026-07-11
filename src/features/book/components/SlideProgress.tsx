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
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {slides.map((key, i) => {
          const done = i < slideIndex
          return (
            <div
              key={key}
              onClick={done ? () => onJump(key) : undefined}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= slideIndex ? 'var(--brand-500)' : 'var(--gray-200)',
                cursor: done ? 'pointer' : 'default',
                transition: 'background 0.2s ease',
              }}
            />
          )
        })}
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-400)' }}>
        {t('stepOfN', { current: slideIndex + 1, total: slides.length })}
        {' · '}
        <span style={{ color: 'var(--gray-700)' }}>{current ? t(LABEL_KEYS[current]) : ''}</span>
      </div>
    </div>
  )
}
