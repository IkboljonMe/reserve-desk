'use client'

import { Check } from 'lucide-react'
import { useTranslation } from '@/i18n'

export function StepIndicator({ step }: { step: number }) {
  const { t } = useTranslation()
  const steps = [
    { n: 1, label: t('hotel') },
    { n: 2, label: t('service') },
    { n: 3, label: t('stepPlan') },
    { n: 4, label: t('stepDateTime') },
    { n: 5, label: t('stepConfirm') },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem' }}>
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
          {n < 5 && <div style={{ flex: 1, height: 2, background: step > n ? 'var(--brand-500)' : 'var(--gray-200)', borderRadius: 1 }} />}
        </div>
      ))}
    </div>
  )
}
