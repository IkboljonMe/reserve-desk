'use client'

import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import Spinner from '@/components/ui/Spinner'
import { useBookingWizard } from '../useBookingWizard'
import { HotelStep } from './HotelStep'
import { ServiceStep } from './ServiceStep'
import { PlanSection } from './PlanSection'
import { GuestSection } from './GuestSection'
import { DateTimeSection } from './DateTimeSection'
import { ReviewStep } from './ReviewStep'
import { SlideProgress } from './SlideProgress'
import Button from '@/components/ui/Button'

import Modal from '@/components/ui/Modal'

export function BookingModal({
  initialDate,
  initialTime,
  onClose,
}: {
  initialDate?: string
  initialTime?: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const w = useBookingWizard({ initialDate, initialTime, onClose })

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={
        <div className="font-normal text-[0.9375rem] w-full">
          <SlideProgress slides={w.slides} slideIndex={w.slideIndex} onJump={w.goToSlide} />
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-between items-center gap-2">
          {w.slideIndex > 0 ? (
            <Button type="button" variant="secondary" onClick={w.goBack} className="inline-flex items-center gap-1.5">
              <ArrowLeft size={14} /> {t('back')}
            </Button>
          ) : <span />}

          {w.currentSlide === 'review' ? (
            <Button type="button" disabled={w.loading || !w.canReview} onClick={w.confirmBooking}>
              {w.loading ? <Spinner size={18} dark={false} /> : null}
              {w.loading ? t('creating') : t('confirmBooking')}
            </Button>
          ) : (
            <Button type="button" disabled={!w.canGoNext} onClick={w.goNext} className="inline-flex items-center gap-1.5">
              {t('next')} <ArrowRight size={14} />
            </Button>
          )}
        </div>
      }
    >
      <div key={w.currentSlide} style={{ animation: 'slideInRight 0.25s ease-out' }}>
        {w.currentSlide === 'hotel' && <HotelStep w={w} />}
        {w.currentSlide === 'service' && <ServiceStep w={w} />}
        {w.currentSlide === 'plan' && <PlanSection w={w} />}
        {w.currentSlide === 'guest' && <GuestSection w={w} />}
        {w.currentSlide === 'datetime' && <DateTimeSection w={w} />}
        {w.currentSlide === 'review' && <ReviewStep w={w} />}
      </div>
    </Modal>
  )
}
