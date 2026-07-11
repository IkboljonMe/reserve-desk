'use client'

import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useBookingWizard } from '../useBookingWizard'
import { HotelStep } from './HotelStep'
import { ServiceStep } from './ServiceStep'
import { PlanSection } from './PlanSection'
import { GuestSection } from './GuestSection'
import { DateTimeSection } from './DateTimeSection'
import { ReviewStep } from './ReviewStep'
import { SlideProgress } from './SlideProgress'

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
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t('close')} style={{ flexShrink: 0 }}>
            <X size={18} />
          </button>
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
            <button type="button" className="btn btn-secondary" onClick={w.goBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> {t('back')}
            </button>
          ) : <span />}

          {w.currentSlide === 'review' ? (
            <button type="button" className="btn btn-primary" disabled={w.loading || !w.canReview} onClick={w.confirmBooking}>
              {w.loading ? <span className="spinner" /> : null}
              {w.loading ? t('creating') : t('confirmBooking')}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={!w.canGoNext} onClick={w.goNext} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t('next')} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
