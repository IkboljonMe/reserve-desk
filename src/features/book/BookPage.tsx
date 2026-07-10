'use client'

import { useTranslation } from '@/i18n'
import { useBookingWizard } from './useBookingWizard'
import { StepIndicator } from './components/StepIndicator'
import { SelectStep } from './components/SelectStep'
import { ReviewStep } from './components/ReviewStep'

export default function BookPage() {
  const { t } = useTranslation()
  const w = useBookingWizard()
  const { step } = w

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header">
        <div>
          <h1>{t('newBooking')}</h1>
          <p style={{ marginTop: 4 }}>{t('reserveForGuest')}</p>
        </div>
      </div>

      <StepIndicator step={step} />

      {step === 1 && <SelectStep w={w} />}
      {step === 2 && <ReviewStep w={w} />}
    </div>
  )
}
