'use client'

import { Check } from 'lucide-react'
import { useTranslation } from '@/i18n'

export function StepIndicator({ step }: { step: number }) {
  const { t } = useTranslation()
  const steps = [
    { n: 1, label: t('stepSelect') },
    { n: 2, label: t('stepReview') },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem', maxWidth: 420 }}>
      {steps.map(({ n, label }) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: step >= n ? 'var(--brand-500)' : 'var(--gray-200)',
            color: step >= n ? '#fff' : 'var(--gray-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.2s', flexShrink: 0,
          }}>{step > n ? <Check size={14} /> : n}</div>
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: step === n ? 600 : 400,
            color: step === n ? 'var(--gray-800)' : 'var(--gray-400)',
            whiteSpace: 'nowrap',
          }}>{label}</span>
          {n < 2 && <div style={{ flex: 1, height: 2, background: step > n ? 'var(--brand-500)' : 'var(--gray-200)', borderRadius: 1 }} />}
        </div>
      ))}
    </div>
  )
}
