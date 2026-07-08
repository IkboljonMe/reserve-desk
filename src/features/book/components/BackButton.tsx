'use client'

import { ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/i18n'

export function BackButton({ to, onBack }: { to: number; onBack: (step: number) => void }) {
  const { t } = useTranslation()
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onBack(to)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <ArrowLeft size={14} /> {t('back')}
    </button>
  )
}
