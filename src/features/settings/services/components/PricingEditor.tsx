'use client'

import { Plus, Trash2, Check, ChevronDown, BedDouble, Users } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { durationError, formatPrice, selectAllOnFocus } from '../utils'
import type { ServicesPageState } from '../useServicesPage'

export function PricingEditor({ s }: { s: ServicesPageState }) {
  const { t } = useTranslation()
  const {
    form, setForm, resolveGroupMeta, collapsedGroups,
    updatePricingPlan, removePricingPlan, removePricingGroup, toggleGroupCollapse,
    addGroupRow, updateGroupRow, removeGroupRow,
    planPicker, setPlanPicker, pickerCategory, setPickerCategory, confirmAddGroup, pickerOptions,
  } = s

  return (
    <div style={{ border: '1px solid var(--brand-100)', borderRadius: 10, padding: 16, background: '#fcfdff' }}>
      <div style={{ marginBottom: '0.875rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--brand-700)', margin: 0 }}>{t('pricingPlans')}</h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', margin: '2px 0 0' }}>
          {t('pricingPlansDesc')}
        </p>
      </div>

      {/* Legacy flat plans (kept editable when a service already has them) */}
      {form.pricingPlans.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--gray-200)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)' }}>{t('generalPlans')}</span>
          {form.pricingPlans.map((plan, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: 4 }}>{t('durationMin')}</label>
                <input
                  type="number" className="form-input hide-arrows" value={plan.duration}
                  onChange={e => updatePricingPlan(index, 'duration', e.target.value)}
                  onFocus={selectAllOnFocus} min={15} step={15} required
                  aria-invalid={durationError(plan.duration)}
                  style={durationError(plan.duration) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: 4 }}>{t('priceUzs')}</label>
                <input
                  type="text" inputMode="numeric" className="form-input price-input"
                  value={formatPrice(plan.price)}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '')
                    updatePricingPlan(index, 'price', digits === '' ? '' : String(Number(digits)))
                  }}
                  onFocus={e => { if (Number(plan.price) === 0) updatePricingPlan(index, 'price', ''); else e.currentTarget.select() }}
                  onBlur={() => { if (plan.price === '') updatePricingPlan(index, 'price', '0') }}
                  placeholder="0" required
                />
              </div>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ marginTop: 22, color: 'var(--danger)' }} onClick={() => removePricingPlan(index)} aria-label={t('removePlanAria', { index: index + 1 })}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category-scoped pricing group cards */}
      {form.pricingGroups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {form.pricingGroups.map((group, gi) => {
            const meta = resolveGroupMeta(group)
            const collapsed = collapsedGroups.has(gi)
            return (
              <div key={gi} style={{ border: `1px solid ${meta.color}40`, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: `${meta.color}10`, cursor: 'pointer' }} onClick={() => toggleGroupCollapse(gi)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: meta.color, fontWeight: 700, fontSize: '0.8rem' }}>
                    {group.target === 'room' ? <BedDouble size={14} /> : <Users size={14} />}
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {group.target === 'room' ? t('room') : t('typeClient')}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                    {group.rows.length} {group.rows.length === 1 ? t('priceLower') : t('pricesWord')}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={e => { e.stopPropagation(); removePricingGroup(gi) }} aria-label={t('removeGroupAria', { label: meta.label })}>
                    <Trash2 size={13} />
                  </button>
                  <ChevronDown size={15} style={{ color: 'var(--gray-400)', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>

                {/* Card body */}
                {!collapsed && (
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {group.rows.map((row, ri) => (
                      <div key={ri} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label" style={{ marginBottom: 4 }}>{t('durationMin')}</label>
                          <input
                            type="number" className="form-input hide-arrows" value={row.duration}
                            onChange={e => updateGroupRow(gi, ri, 'duration', e.target.value)}
                            onFocus={selectAllOnFocus} min={15} step={15} required
                            aria-invalid={durationError(row.duration)}
                            style={durationError(row.duration) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label" style={{ marginBottom: 4 }}>{t('priceUzs')}</label>
                          <input
                            type="text" inputMode="numeric" className="form-input price-input"
                            value={formatPrice(row.price)}
                            onChange={e => {
                              const digits = e.target.value.replace(/\D/g, '')
                              updateGroupRow(gi, ri, 'price', digits === '' ? '' : String(Number(digits)))
                            }}
                            onFocus={e => { if (Number(row.price) === 0) updateGroupRow(gi, ri, 'price', ''); else e.currentTarget.select() }}
                            onBlur={() => { if (row.price === '') updateGroupRow(gi, ri, 'price', '0') }}
                            placeholder="0" required
                          />
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ marginTop: 22, color: 'var(--danger)' }} onClick={() => removeGroupRow(gi, ri)} aria-label={t('removePriceAria', { index: ri + 1 })} disabled={group.rows.length === 1}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', color: meta.color }} onClick={() => addGroupRow(gi)}>
                      <Plus size={13} /> {t('addPrice')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add-plan mini flow */}
      {planPicker === null && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPlanPicker('choose')}>
          <Plus size={13} /> {t('addPlan')}
        </button>
      )}

      {planPicker === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)' }}>{t('whoIsPriceFor')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPlanPicker('room'); setPickerCategory('') }}>
              <BedDouble size={14} /> {t('roomCategoryLabel')}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPlanPicker('client'); setPickerCategory('') }}>
              <Users size={14} /> {t('clientGroupLabel')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlanPicker(null)}>{t('cancel')}</button>
          </div>
        </div>
      )}

      {(planPicker === 'room' || planPicker === 'client') && (() => {
        const opts = pickerOptions()
        const emptyMsg = planPicker === 'room'
          ? (!form.hotelId ? t('selectHotelFirst') : t('noMoreRoomCats'))
          : t('noMoreClientGroups')
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)' }}>
              {planPicker === 'room' ? t('whichRoomCategory') : t('whichClientGroup')}
            </span>
            {opts.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: 0 }}>{emptyMsg}</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  className="form-select" style={{ width: 'auto', minWidth: 180 }}
                  value={pickerCategory} onChange={e => setPickerCategory(e.target.value)}
                  aria-label={t('selectCategory')}
                >
                  <option value="">{t('chooseDots')}</option>
                  {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button type="button" className="btn btn-primary btn-sm" onClick={confirmAddGroup} disabled={!pickerCategory}>
                  <Check size={13} /> {t('add')}
                </button>
              </div>
            )}
            <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setPlanPicker(null); setPickerCategory('') }}>{t('cancel')}</button>
          </div>
        )
      })()}

      {/* Flat legacy price fallback when nothing else is defined */}
      {form.pricingPlans.length === 0 && form.pricingGroups.length === 0 && planPicker === null && (
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label" style={{ color: 'var(--gray-500)' }}>{t('flatPriceOptional')}</label>
          <input type="number" className="form-input" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
        </div>
      )}
    </div>
  )
}
