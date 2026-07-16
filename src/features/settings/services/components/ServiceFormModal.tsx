'use client'

import { Building2, Check, X, Plus, Trash2, Layers } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { ServiceIcon } from '@/lib/serviceIcons'
import IconPicker from '@/components/IconPicker'
import Select from '@/components/Select'
import { InfoHint } from '@/components/ui/InfoHint'
import Spinner from '@/components/ui/Spinner'
import { PRESET_COLORS, bufferError, selectAllOnFocus } from '../utils'
import { PricingEditor } from './PricingEditor'
import { ScheduleEditor } from './ScheduleEditor'
import type { ServicesPageState } from '../useServicesPage'
import Button from '@/components/ui/Button'

export function ServiceFormModal({ s }: { s: ServicesPageState }) {
  const { t } = useTranslation()
  const {
    showForm, closeForm, editService, form, setForm, hotels, handleSubmit, discardDraft, saving,
    resolveGroupMeta, roomTypeOptions, clientGroups,
    setBasePricing, addVariant, removeVariant, updateVariantName, setVariantPricing,
  } = s
  if (!showForm) return null

  return (
    <div className="modal-overlay" onClick={closeForm}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Preview icon in title */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 10,
              background: `${form.color}18`, border: `1.5px solid ${form.color}40`,
              color: form.color, flexShrink: 0,
            }}>
              <ServiceIcon name={form.icon} size={18} />
            </span>
            <h2 style={{ margin: 0 }}>{editService ? t('editColon', { name: editService.name }) : t('addService')}</h2>
          </div>
          <Button variant="ghost" icon onClick={closeForm} aria-label={t('close')}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
              <div className="form-group">
                <label className="form-label">{t('name')} *<InfoHint text={t('nameHint')} /></label>
                <input
                  type="text" className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('icon')} *<InfoHint text={t('iconHint')} /></label>
                <IconPicker value={form.icon} onChange={name => setForm(f => ({ ...f, icon: name }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('hotel')} *<InfoHint text={t('hotelHint')} /></label>
              <Select
                ariaLabel={t('selectHotel')}
                placeholder={t('selectHotel')}
                icon={<Building2 size={16} />}
                value={form.hotelId}
                onChange={v => setForm(f => ({
                  ...f,
                  hotelId: v,
                  // Drop the new owner from the shared list if it was there.
                  sharedHotelIds: f.sharedHotelIds.filter(id => id !== v),
                }))}
                options={hotels.map(h => ({ value: h._id, label: h.name }))}
              />
            </div>

            {form.hotelId && hotels.length > 1 && (
              <div className="form-group">
                <label className="form-label">{t('sharedWithHotels')}<InfoHint text={t('sharedWithHotelsHint')} /></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {hotels.filter(h => h._id !== form.hotelId).map(h => {
                    const on = form.sharedHotelIds.includes(h._id)
                    return (
                      <button
                        key={h._id}
                        type="button"
                        className={`svc-filter-pill ${on ? 'active' : ''}`}
                        aria-pressed={on}
                        onClick={() => setForm(f => ({
                          ...f,
                          sharedHotelIds: on
                            ? f.sharedHotelIds.filter(id => id !== h._id)
                            : [...f.sharedHotelIds, h._id],
                        }))}
                      >
                        {on ? <Check size={12} /> : <Building2 size={12} />} {h.name}
                      </button>
                    )
                  })}
                </div>
                <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 6 }}>
                  {t('sharedWithHotelsHint')}
                </small>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('description')}<InfoHint text={t('descriptionHint')} /></label>
              <textarea
                className="form-textarea" style={{ minHeight: 60 }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('details')}<InfoHint text={t('detailsHint')} /></label>
              <input type="text" className="form-input" placeholder={t('detailsPlaceholder')} value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} />
            </div>

            <div className="h-px bg-surface-border" style={{ margin: '0.1rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('opensAt')} *<InfoHint text={t('opensAtHint')} /></label>
                <input type="time" className="form-input" value={form.openTime} onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('closesAt')} *<InfoHint text={t('closesAtHint')} /></label>
                <input type="time" className="form-input" value={form.closeTime} onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('bufferBefore')}<InfoHint text={t('bufferBeforeHint')} /></label>
                <input
                  type="number" className="form-input hide-arrows"
                  min={0} max={120} step={15} placeholder="e.g. 15"
                  value={form.bufferTimeBefore} onFocus={selectAllOnFocus}
                  onChange={e => setForm(f => ({ ...f, bufferTimeBefore: Number(e.target.value) }))}
                  aria-invalid={bufferError(form.bufferTimeBefore)}
                  style={bufferError(form.bufferTimeBefore) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                />
                {bufferError(form.bufferTimeBefore)
                  ? <small className="form-error" style={{ display: 'block', marginTop: 4 }}>{t('mustBe15')}</small>
                  : <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>{t('min15IntervalsShort')}</small>}
              </div>
              <div className="form-group">
                <label className="form-label">{t('bufferAfter')}<InfoHint text={t('bufferAfterHint')} /></label>
                <input
                  type="number" className="form-input hide-arrows"
                  min={0} max={120} step={15} placeholder="e.g. 15"
                  value={form.bufferTimeAfter} onFocus={selectAllOnFocus}
                  onChange={e => setForm(f => ({ ...f, bufferTimeAfter: Number(e.target.value) }))}
                  aria-invalid={bufferError(form.bufferTimeAfter)}
                  style={bufferError(form.bufferTimeAfter) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                />
                {bufferError(form.bufferTimeAfter)
                  ? <small className="form-error" style={{ display: 'block', marginTop: 4 }}>{t('mustBe15')}</small>
                  : <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>{t('min15IntervalsShort')}</small>}
              </div>
            </div>

            <ScheduleEditor
              weeklyHours={form.weeklyHours}
              blackoutDates={form.blackoutDates}
              defaultOpen={form.openTime}
              defaultClose={form.closeTime}
              onChange={next => setForm(f => ({
                ...f,
                ...(next.weeklyHours !== undefined && { weeklyHours: next.weeklyHours }),
                ...(next.blackoutDates !== undefined && { blackoutDates: next.blackoutDates }),
              }))}
            />

            <div className="form-group">
              <label className="form-label">{t('calendarColor')}<InfoHint text={t('calendarColorHint')} /></label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c} type="button"
                    className={`w-[26px] h-[26px] rounded-full cursor-pointer border-2 border-white transition duration-[120ms] hover:scale-[1.15] ${
                      form.color === c ? 'shadow-[0_0_0_2px_var(--color-gray-900)]' : 'shadow-[0_0_0_1.5px_var(--color-gray-200)]'
                    }`}
                    style={{ background: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    title={c} aria-label={t('calendarColorAria', { color: c })} aria-pressed={form.color === c}
                  />
                ))}
              </div>
            </div>

            {/* ── Pricing: either a single block, or one block per variant ── */}
            {form.variants.length === 0 ? (
              <>
                <PricingEditor
                  plans={form.pricingPlans}
                  groups={form.pricingGroups}
                  onChange={setBasePricing}
                  roomTypeOptions={roomTypeOptions}
                  clientGroups={clientGroups}
                  resolveGroupMeta={resolveGroupMeta}
                  hotelSelected={!!form.hotelId}
                  flatPrice={form.price}
                  onFlatPrice={n => setForm(f => ({ ...f, price: n }))}
                />
                <div>
                  <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
                    <Layers size={14} /> {t('addVariant')}
                  </Button>
                  <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 6 }}>
                    {t('variantsHint')}
                  </small>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={14} /> {t('serviceVariants')}
                  </label>
                  <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 2 }}>
                    {t('variantsHint')}
                  </small>
                </div>

                {form.variants.map(v => (
                  <div key={v.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, background: '#fff' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label className="form-label">{t('variantName')} *</label>
                        <input
                          type="text" className="form-input"
                          value={v.name}
                          placeholder={t('variantNamePlaceholder')}
                          onChange={e => updateVariantName(v.id, e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="button" variant="ghost" icon
                        style={{ color: 'var(--danger)' }}
                        onClick={() => removeVariant(v.id)}
                        aria-label={t('removeVariant', { name: v.name || '' })}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <PricingEditor
                      plans={v.pricingPlans}
                      groups={v.pricingGroups}
                      onChange={val => setVariantPricing(v.id, val)}
                      roomTypeOptions={roomTypeOptions}
                      clientGroups={clientGroups}
                      resolveGroupMeta={resolveGroupMeta}
                      hotelSelected={!!form.hotelId}
                      heading={t('pricingPlansFor', { name: v.name || t('variant') })}
                    />
                  </div>
                ))}

                <Button type="button" variant="secondary" size="sm" style={{ alignSelf: 'flex-start' }} onClick={addVariant}>
                  <Plus size={14} /> {t('addVariant')}
                </Button>
              </div>
            )}
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
            {!editService ? (
              <Button type="button" variant="ghost" size="sm" onClick={discardDraft} style={{ color: 'var(--gray-400)' }}>
                {t('discardDraft')}
              </Button>
            ) : <span />}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button type="button" variant="secondary" onClick={closeForm}>{t('cancel')}</Button>
              <Button id="save-service-btn" type="submit" disabled={saving}>
                {saving ? <Spinner size={18} dark={false} /> : null}
                {saving ? t('saving') : (editService ? t('save') : t('save'))}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
