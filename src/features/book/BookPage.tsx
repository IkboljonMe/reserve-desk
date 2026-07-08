'use client'

import { useTranslation } from '@/i18n'
import { useBookingWizard } from './useBookingWizard'
import { StepIndicator } from './components/StepIndicator'
import { HotelStep } from './components/HotelStep'
import { ServiceStep } from './components/ServiceStep'
import { PlanStep } from './components/PlanStep'
import { DateTimeStep } from './components/DateTimeStep'
import { ConfirmStep } from './components/ConfirmStep'

export default function BookPage() {
  const { t } = useTranslation()
  const w = useBookingWizard()
  const { step, selectedHotelId, handleSubmit } = w

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header">
        <div>
          <h1>{t('newBooking')}</h1>
          <p style={{ marginTop: 4 }}>{t('reserveForGuest')}</p>
        </div>
      </div>

      <StepIndicator step={step} />

      <form onSubmit={handleSubmit}>
        {step === 1 && <HotelStep w={w} />}
        {step === 2 && selectedHotelId && <ServiceStep w={w} />}
        {step === 3 && <PlanStep w={w} />}
        {step === 4 && <DateTimeStep w={w} />}
        {step === 5 && <ConfirmStep w={w} />}
      </form>
    </div>
  )
}
