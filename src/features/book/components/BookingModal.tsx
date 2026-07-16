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
        className="modal"
        style={{
          width: '100%',
          maxWidth: isMobile ? 'none' : 640,
          height: isMobile ? '100dvh' : 'min(88dvh, 720px)',
          maxHeight: isMobile ? '100dvh' : '88dvh',
          borderRadius: isMobile ? 0 : undefined,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header — slide progress + close */}
        <div style={{
          padding: isMobile ? '1rem 1rem 0.75rem' : '1.5rem 1.75rem 1rem',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <SlideProgress slides={w.slides} slideIndex={w.slideIndex} onJump={w.goToSlide} />
          <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('close')} style={{ flexShrink: 0 }}>
            <X size={18} />
          </Button>
        </div>

        {/* Body — the active slide */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1.1rem 1rem' : '1.5rem 1.75rem' }}>
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
        <div style={{
          padding: isMobile ? '0.85rem 1rem' : '1rem 1.75rem',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        }}>
          {w.slideIndex > 0 ? (
            <Button type="button" variant="secondary" onClick={w.goBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> {t('back')}
            </Button>
          ) : <span />}

          {w.currentSlide === 'review' ? (
            <Button type="button" disabled={w.loading || !w.canReview} onClick={w.confirmBooking}>
              {w.loading ? <Spinner size={18} dark={false} /> : null}
              {w.loading ? t('creating') : t('confirmBooking')}
            </Button>
          ) : (
            <Button type="button" disabled={!w.canGoNext} onClick={w.goNext} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t('next')} <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
