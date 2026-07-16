'use client'

import { useTranslation } from '@/i18n'

// `dark` (brand-colored ring) suits a light/white background — e.g. a
// full-page loading state. The light ring (white, default off) suits a
// solid brand-colored button, where the spinner sits on brand-500 itself.
export default function Spinner({
  size = 20,
  dark = true,
  borderWidth = 2,
  className = '',
}: {
  size?: number
  dark?: boolean
  borderWidth?: number
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <span
      data-spinner
      className={`inline-block shrink-0 rounded-full [animation:spin_0.6s_linear_infinite] ${
        dark ? 'border-brand-500/18 border-t-brand-500' : 'border-white/30 border-t-white'
      } ${className}`.trim()}
      style={{ width: size, height: size, borderWidth }}
      role="status"
      aria-label={t('loading')}
    />
  )
}
