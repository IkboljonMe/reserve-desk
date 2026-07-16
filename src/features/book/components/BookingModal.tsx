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
    <div className="modal-overlay" onClick={onClose} style={isMobile ? { padding: 0 } : undefined}>
      <div
        onClick={e => e.stopPropagation()}
        className="modal flex flex-col overflow-hidden"
        style={{
          width: '100%',
          maxWidth: isMobile ? 'none' : 640,
          height: isMobile ? '100dvh' : 'min(88dvh, 720px)',
          maxHeight: isMobile ? '100dvh' : '88dvh',
          borderRadius: isMobile ? 0 : undefined,
          padding: 0,
        }}
      >
        {/* Header — slide progress + close */}
        <div
          className="flex items-start gap-3 border-b border-surface-border"
          style={{ padding: isMobile ? '1rem 1rem 0.75rem' : '1.5rem 1.75rem 1rem' }}
        >
          <SlideProgress slides={w.slides} slideIndex={w.slideIndex} onJump={w.goToSlide} />
          <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('close')} className="shrink-0">
            <X size={18} />
          </Button>
        </div>

        {/* Body — the active slide */}
        <div
          className="flex-1 overflow-auto"
          style={{ padding: isMobile ? '1.1rem 1rem' : '1.5rem 1.75rem' }}
        >
          <div key={w.currentSlide} style={{ animation: 'slideInRight 0.25s ease-out' }}>
            {w.currentSlide === 'hotel' && <HotelStep w={w} />}
            {w.currentSlide === 'service' && <ServiceStep w={w} />}
            {w.currentSlide === 'plan' && <PlanSection w={w} />}
            {w.currentSlide === 'guest' && <GuestSection w={w} />}
            {w.currentSlide === 'datetime' && <DateTimeSection w={w} />}
            {w.currentSlide === 'review' && <ReviewStep w={w} />}
          </div>
        </div>

        {/* Footer — back / next / confirm */}
        <div
          className="flex justify-between items-center gap-2 border-t border-surface-border"
          style={{ padding: isMobile ? '0.85rem 1rem' : '1rem 1.75rem' }}
        >
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
      </div>
    </div>
  )
}
