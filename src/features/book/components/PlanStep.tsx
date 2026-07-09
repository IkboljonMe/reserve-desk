'use client'

import { useTranslation } from '@/i18n'
import { TYPE_META } from '../constants'
import { optionCardStyle } from '../styles'
import { formatDuration, formatUZS } from '../utils'
import type { BookingType } from '../types'
import { BackButton } from './BackButton'
import { ContextBar } from './ContextBar'
import type { BookingWizard } from '../useBookingWizard'

export function PlanStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation()
  const {
    selectedService, bookingType, clientCats, roomCats, chooseType, resolveGroupMeta,
    selectedCategory, chooseCategory, planRows, selectedPlan, setSelectedPlan, setSelectedSlot,
    categoryMeta, customDuration, setCustomDuration, customValid, customPrice, setCustomPrice,
    planReady, setStep, hasVariants, selectedVariant, chooseVariant,
  } = w
  if (!selectedService) return null

  // With variants, the guest must pick one before the pricing options appear.
  const showPlanOptions = !hasVariants || !!selectedVariant

  return (
    <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <BackButton to={2} onBack={setStep} />
        <h2 style={{ margin: 0 }}>{t('choosePlan')}</h2>
      </div>
      <ContextBar w={w} />

      {/* Variant selector (only for services that define variants) */}
      {hasVariants && (
        <div style={{ marginBottom: showPlanOptions ? '1.5rem' : 0 }}>
          <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>{t('chooseVariant')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(selectedService.variants ?? []).map(v => {
              const active = selectedVariant?.id === v.id
              const accent = selectedService.color
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => chooseVariant(v)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 10,
                    border: `2px solid ${active ? accent : 'var(--gray-200)'}`,
                    background: active ? `${accent}15` : '#fff',
                    color: active ? accent : 'var(--gray-800)',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  {v.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showPlanOptions && (<>
      {/* Type selector */}
      <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>{t('whoIsThisFor')}</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: planReady || bookingType ? '1.5rem' : 0 }}>
        {(Object.keys(TYPE_META) as BookingType[]).map(type => {
          const meta = TYPE_META[type]
          const disabled = (type === 'client' && clientCats.length === 0) || (type === 'room' && roomCats.length === 0)
          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => chooseType(type)}
              title={disabled ? t('noPricingSetFor', { label: t(meta.labelKey).toLowerCase() }) : undefined}
              style={{
                ...optionCardStyle(bookingType === type, meta.color),
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 10,
                background: `${meta.color}18`, color: meta.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{meta.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-800)' }}>{t(meta.labelKey)}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 2 }}>
                {disabled ? t('notConfigured') : t(meta.descKey)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Category + plan rows (client / room) */}
      {(bookingType === 'client' || bookingType === 'room') && (
        <>
          <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
            {bookingType === 'client' ? t('chooseClientGroup') : t('chooseRoomCategory')}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: selectedCategory ? '1.5rem' : 0 }}>
            {(bookingType === 'client' ? clientCats : roomCats).map(g => {
              const meta = resolveGroupMeta(g)
              const active = selectedCategory === g.category
              return (
                <button
                  key={g.category}
                  type="button"
                  onClick={() => chooseCategory(g.category)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 999,
                    border: `2px solid ${active ? meta.color : 'var(--gray-200)'}`,
                    background: active ? `${meta.color}15` : '#fff',
                    color: active ? meta.color : 'var(--gray-700)',
                    fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                  {meta.label}
                </button>
              )
            })}
          </div>

          {selectedCategory && (
            <>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>{t('chooseDurationPrice')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {planRows.map((plan, i) => {
                  const active = selectedPlan?.duration === plan.duration && selectedPlan?.price === plan.price
                  const accent = categoryMeta?.color || selectedService.color
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSelectedPlan(plan); setSelectedSlot('') }}
                      style={{
                        padding: '10px 16px', borderRadius: 10,
                        border: `2px solid ${active ? accent : 'var(--gray-200)'}`,
                        background: active ? `${accent}15` : '#fff',
                        textAlign: 'left', cursor: 'pointer', minWidth: 110,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{formatDuration(plan.duration)}</div>
                      <div style={{ fontSize: '0.78rem', color: accent, fontWeight: 600 }}>
                        {plan.price > 0 ? `${formatUZS(plan.price)} ${t('sum')}` : t('isFree')}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Custom inputs */}
      {bookingType === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 420 }}>
          <div className="form-group">
            <label className="form-label">{t('durationMin')}</label>
            <input
              type="number" className="form-input" min={15} step={15}
              value={customDuration}
              onChange={e => { setCustomDuration(Number(e.target.value)); setSelectedSlot('') }}
              onFocus={e => e.currentTarget.select()}
              aria-invalid={!customValid}
              style={!customValid ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
            />
            <small style={{ color: customValid ? 'var(--gray-400)' : 'var(--danger)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>
              {customValid ? t('minute15Intervals') : t('multipleOf15')}
            </small>
          </div>
          <div className="form-group">
            <label className="form-label">{t('priceUzs')}</label>
            <input
              type="text" inputMode="numeric" className="form-input"
              value={customPrice ? formatUZS(customPrice) : ''}
              onChange={e => setCustomPrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
              onFocus={e => e.currentTarget.select()}
              placeholder="0"
            />
            <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>{t('setOneOffPrice')}</small>
          </div>
        </div>
      )}

      {planReady && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>{t('continueBtn')}</button>
        </div>
      )}
      </>)}
    </div>
  )
}
