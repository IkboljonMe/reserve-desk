'use client'

import { useTranslation } from '@/i18n'

export default function Spinner({
  size = 20,
  dark = true,
  className = '',
}: {
  size?: number
  dark?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <span
      className={`spinner ${dark ? 'spinner-dark' : ''} ${className}`.trim()}
      style={{ width: size, height: size }}
      role="status"
      aria-label={t('loading')}
    />
  )
}
