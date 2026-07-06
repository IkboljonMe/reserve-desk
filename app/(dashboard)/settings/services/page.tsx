'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useDraft } from '@/components/DraftProvider'
import { useTranslation } from '@/lib/i18n'
import { ServiceIcon } from '@/lib/serviceIcons'
import IconPicker from '@/components/IconPicker'
import Select from '@/components/Select'
import { Building2 } from 'lucide-react'

interface Hotel {
  _id: string
  name: string
}

interface PricingPlan {
  duration: number | string
  price: number | string
}

interface Service {
  _id: string
  name: string
  icon: string
  description: string
  hotelId: string
  openTime: string
  closeTime: string
  slotDuration: number
  capacity: number
  price?: number
  isFree?: boolean
  details?: string
  bufferTimeBefore?: number
  bufferTimeAfter?: number
  pricingPlans?: PricingPlan[]
  color: string
  isActive: boolean
}

const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b',
  '#10b981','#06b6d4','#3b82f6','#f97316','#84cc16',
  '#64748b','#a16207',
]

const DRAFT_KEY = 'add-service'

const EMPTY_FORM = {
  name: '', description: '', hotelId: '', icon: 'Waves',
  openTime: '08:00', closeTime: '20:00',
  slotDuration: 60, capacity: 1, color: '#6366f1',
  price: 0, isFree: false, details: '',
  bufferTimeBefore: 0, bufferTimeAfter: 0, pricingPlans: [] as PricingPlan[]
}

// Durations must be booked on a 15-minute grid (15, 30, 45, 60 …).
const DURATION_STEP = 15

// True when a duration has been entered but is not a positive multiple of 15.
// Empty values are left for the `required` attribute to handle.
function durationError(v: number | string): boolean {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  return !Number.isInteger(n) || n <= 0 || n % DURATION_STEP !== 0
}

// Like durationError, but 0 is allowed (0 = no buffer).
function bufferError(v: number | string): boolean {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  return !Number.isInteger(n) || n < 0 || n % DURATION_STEP !== 0
}

// Select the whole value on focus so a click replaces the number instead of
// dropping a caret at the end.
function selectAllOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.select()
}

// Format a price with a space every 3 digits from the right: 1000000 -> "1 000 000".
function formatPrice(v: number | string): string {
  const digits = String(v ?? '').replace(/\D/g, '')
  if (digits === '') return ''
  return String(Number(digits)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function ServicesPage() {
  const { showToast } = useToast()
  const { getDraft, saveDraft, clearDraft } = useDraft()
  const { t } = useTranslation()
  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [res, hRes] = await Promise.all([
      fetch('/api/services'),
      fetch('/api/hotels'),
    ])
    const data = await res.json()
    const hData = await hRes.json()
    setServices(data)
    setHotels(Array.isArray(hData) ? hData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAddForm() {
    setEditService(null)
    const draft = getDraft<typeof EMPTY_FORM>(DRAFT_KEY)
    if (draft) {
      setForm({ ...EMPTY_FORM, ...draft })
      showToast('Restored your unsaved draft', 'info')
    } else {
      setForm({ ...EMPTY_FORM })
    }
    setShowForm(true)
  }

  // Auto-save the add-service draft so accidentally closing the modal doesn't
  // lose the user's input (kept for 1h by DraftProvider). Editing existing
  // services is not drafted.
  useEffect(() => {
    if (showForm && !editService) {
      saveDraft(DRAFT_KEY, form)
    }
  }, [form, showForm, editService, saveDraft])

  function discardDraft() {
    clearDraft(DRAFT_KEY)
    setForm({ ...EMPTY_FORM })
    showToast('Draft cleared', 'info')
  }

  function openEditForm(svc: Service) {
    setEditService(svc)
    setForm({
      name: svc.name,
      icon: svc.icon || 'Waves',
      description: svc.description,
      hotelId: svc.hotelId,
      openTime: svc.openTime,
      closeTime: svc.closeTime,
      slotDuration: svc.slotDuration,
      capacity: svc.capacity,
      price: svc.price || 0,
      isFree: svc.isFree || false,
      details: svc.details || '',
      bufferTimeBefore: svc.bufferTimeBefore || 0,
      bufferTimeAfter: svc.bufferTimeAfter || 0,
      pricingPlans: svc.pricingPlans || [],
      color: svc.color,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditService(null)
  }

  function addPricingPlan() {
    setForm(f => ({
      ...f,
      pricingPlans: [...f.pricingPlans, { duration: 60, price: 0 }]
    }))
  }

  function updatePricingPlan(index: number, key: keyof PricingPlan, value: string) {
    const plans = [...form.pricingPlans]
    plans[index][key] = value === '' ? '' : Number(value)
    setForm(f => ({ ...f, pricingPlans: plans }))
  }

  function removePricingPlan(index: number) {
    const plans = [...form.pricingPlans]
    plans.splice(index, 1)
    setForm(f => ({ ...f, pricingPlans: plans }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Hotel is required (the custom Select can't use the native `required`).
    if (!form.hotelId) {
      showToast('Please select a hotel', 'error')
      return
    }

    // Block save if any pricing plan has a duration that isn't a multiple of 15.
    if (!form.isFree && form.pricingPlans.length > 0) {
      const hasBadDuration = form.pricingPlans.some(p => p.duration === '' || durationError(p.duration))
      if (hasBadDuration) {
        showToast('Each plan duration must be a multiple of 15 minutes (e.g. 15, 30, 45, 60)', 'error')
        return
      }
    }

    // Buffers must also sit on the 15-minute grid (0 allowed = no buffer).
    if (bufferError(form.bufferTimeBefore) || bufferError(form.bufferTimeAfter)) {
      showToast('Buffer times must be a multiple of 15 minutes (e.g. 0, 15, 30, 45)', 'error')
      return
    }

    setSaving(true)
    try {
      const url = editService ? `/api/services/${editService._id}` : '/api/services'
      const method = editService ? 'PUT' : 'POST'
      const payload = {
        ...form,
        pricingPlans: form.pricingPlans.map(p => ({
          duration: Number(p.duration) || 0,
          price: Number(p.price) || 0,
        })),
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        showToast(editService ? 'Service updated!' : 'Service created!', 'success')
        if (!editService) clearDraft(DRAFT_KEY)
        closeForm()
        load()
      } else {
        const d = await res.json()
        showToast(d.error || 'Failed to save', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(svc: Service) {
    const res = await fetch(`/api/services/${svc._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !svc.isActive }),
    })
    if (res.ok) {
      showToast(svc.isActive ? `${t('services')} deactivated` : `${t('services')} activated`, 'info')
      load()
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Service deleted', 'success')
      setDeleteConfirm(null)
      load()
    } else {
      showToast('Failed to delete', 'error')
    }
  }

  return (
    <div>
      <style>{`
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows[type=number] {
          -moz-appearance: textfield;
        }
        .price-input {
          font-variant-numeric: tabular-nums;
          letter-spacing: 2px;
          font-weight: 500;
        }
        .price-input::placeholder {
          letter-spacing: normal;
          font-weight: 400;
        }
      `}</style>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>{t('services')}</h2>
        </div>
        <button id="add-service-btn" className="btn btn-primary" onClick={openAddForm}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          {t('addService')}
        </button>
      </div>

      {/* Service List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <span className="spinner spinner-dark" style={{ width: 24, height: 24 }} />
        </div>
      ) : services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3>No {t('services').toLowerCase()} yet</h3>
            <button className="btn btn-primary" onClick={openAddForm}>{t('addService')}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {services.map(svc => (
            <div key={svc._id} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${svc.color}25`,
                  border: `2px solid ${svc.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 4,
                  color: svc.color,
                }}>
                  <ServiceIcon name={svc.icon} serviceName={svc.name} size={20} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--gray-800)', fontSize: '1rem' }}>{svc.name}</strong>
                    <span className={`badge ${svc.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {svc.isActive ? t('active') : t('inactive')}
                    </span>
                    {svc.isFree ? (
                      <span className="badge badge-blue">{t('isFree')}</span>
                    ) : (
                      svc.pricingPlans && svc.pricingPlans.length > 0 ? (
                        <span className="badge badge-blue">{svc.pricingPlans.length} {t('pricingPlans')}</span>
                      ) : (
                         svc.price && svc.price > 0 ? <span className="badge badge-gray"> uzs {svc.price.toLocaleString()}</span> : null
                      )
                    )}
                    {(svc.bufferTimeBefore && svc.bufferTimeBefore > 0) || (svc.bufferTimeAfter && svc.bufferTimeAfter > 0) ? (
                       <span className="badge badge-warning">🧹 {svc.bufferTimeBefore || 0}m / {svc.bufferTimeAfter || 0}m {t('bufferTime')}</span>
                    ) : null}
                  </div>
                  
                  {svc.pricingPlans && svc.pricingPlans.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {svc.pricingPlans.map((plan, i) => (
                         <div key={i} style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                           {plan.duration}m = {plan.price.toLocaleString()} uzs
                         </div>
                      ))}
                    </div>
                  )}

                  {(svc.description || svc.details) && (
                    <p style={{ fontSize: '0.8125rem', marginTop: 4, color: 'var(--gray-500)' }}>
                      {svc.description} {svc.details ? `— [${t('details')}: ${svc.details}]` : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: 6, fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    <span>🕐 {svc.openTime} – {svc.closeTime}</span>
                    <span>👥 {t('capacity')}: {svc.capacity}</span>
                    {svc.hotelId && <span>🏢 {hotels.find(h => h._id === svc.hotelId)?.name}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleActive(svc)}
                    title={svc.isActive ? t('inactive') : t('active')}
                  >
                    {svc.isActive ? t('inactive') : t('active')}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    onClick={() => openEditForm(svc)}
                    title={t('edit')}
                    aria-label={t('edit')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  {deleteConfirm === svc._id ? (
                    <>
                       <button className="btn btn-danger btn-sm" onClick={() => handleDelete(svc._id)}>{t('delete')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                    </>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => setDeleteConfirm(svc._id)}
                      title={t('delete')}
                      aria-label={t('delete')}
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div className="modal-header">
              <h2>{editService ? t('edit') : t('addService')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeForm} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Icon *
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 26, height: 26, borderRadius: 7,
                      background: `${form.color}20`, border: `1.5px solid ${form.color}`,
                      color: form.color,
                    }}>
                      <ServiceIcon name={form.icon} size={15} />
                    </span>
                  </label>
                  <IconPicker value={form.icon} onChange={name => setForm(f => ({ ...f, icon: name }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Hotel *</label>
                  <Select
                    ariaLabel="Select hotel"
                    placeholder="Select hotel"
                    icon={<Building2 size={16} />}
                    value={form.hotelId}
                    onChange={v => setForm(f => ({ ...f, hotelId: v }))}
                    options={hotels.map(h => ({ value: h._id, label: h.name }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 60 }}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Advanced Row 2: Pricing */}
                <div style={{ border: '1px solid var(--brand-100)', borderRadius: 8, padding: 16, background: '#fcfdff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t('pricingPlans')}
                    </h3>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={form.isFree}
                        onChange={e => setForm(f => ({ ...f, isFree: e.target.checked, price: e.target.checked ? 0 : f.price, pricingPlans: [] }))}
                        style={{ width: 16, height: 16 }}
                      />
                      {t('isFree')}
                    </label>
                  </div>

                  {!form.isFree && (
                    <>
                      {form.pricingPlans.length === 0 ? (
                        <div style={{ marginBottom: 12 }}>
                          <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--gray-600)' }}>Flat {t('price')} (Legacy)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={form.price}
                              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                            />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {form.pricingPlans.map((plan, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" style={{ marginBottom: 4 }}>{t('durationMin')}</label>
                                <input
                                  type="number" className="form-input hide-arrows" value={plan.duration}
                                  onChange={e => updatePricingPlan(index, 'duration', e.target.value)}
                                  onFocus={selectAllOnFocus}
                                  min={15} step={15} required
                                  aria-invalid={durationError(plan.duration)}
                                  style={durationError(plan.duration)
                                    ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
                                    : undefined}
                                />
                                {durationError(plan.duration) ? (
                                  <small className="form-error" style={{ display: 'block', marginTop: 4 }}>
                                    Must be a multiple of 15 — e.g. 15, 30, 45, 60, 75, 90…
                                  </small>
                                ) : (
                                  <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>15 min interval</small>
                                )}
                              </div>
                              <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" style={{ marginBottom: 4 }}>{t('price')} (UZS)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="form-input price-input"
                                  value={formatPrice(plan.price)}
                                  onChange={e => {
                                    const digits = e.target.value.replace(/\D/g, '')
                                    updatePricingPlan(index, 'price', digits === '' ? '' : String(Number(digits)))
                                  }}
                                  onFocus={e => {
                                    if (Number(plan.price) === 0) updatePricingPlan(index, 'price', '')
                                    else e.currentTarget.select()
                                  }}
                                  onBlur={() => { if (plan.price === '') updatePricingPlan(index, 'price', '0') }}
                                  placeholder="0"
                                  required
                                />
                              </div>
                              <button type="button" className="btn btn-danger" style={{ padding: '0 0.75rem', height: '42px', marginTop: '22px' }} onClick={() => removePricingPlan(index)} aria-label={`Remove pricing plan ${index + 1}`}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button type="button" className="btn btn-secondary btn-sm" onClick={addPricingPlan}>
                        + {t('addPlan')}
                      </button>
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('details')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Toyota Hiace, 45 kishilik..."
                    value={form.details}
                    onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                  />
                </div>
                
                <div className="divider" style={{ margin: '0.25rem 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Opens at *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.openTime}
                      onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Closes at *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.closeTime}
                      onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">🧹 Buffer Before (min)</label>
                    <input
                      type="number"
                      className="form-input hide-arrows"
                      min={0} max={120} step={15}
                      placeholder="e.g. 15"
                      value={form.bufferTimeBefore}
                      onFocus={selectAllOnFocus}
                      onChange={e => setForm(f => ({ ...f, bufferTimeBefore: Number(e.target.value) }))}
                      aria-invalid={bufferError(form.bufferTimeBefore)}
                      style={bufferError(form.bufferTimeBefore)
                        ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
                        : undefined}
                    />
                    {bufferError(form.bufferTimeBefore) ? (
                      <small className="form-error" style={{ display: 'block', marginTop: 4 }}>
                        Must be a multiple of 15 — e.g. 0, 15, 30, 45…
                      </small>
                    ) : (
                      <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>15 min interval</small>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">🧹 Buffer After (min)</label>
                    <input
                      type="number"
                      className="form-input hide-arrows"
                      min={0} max={120} step={15}
                      placeholder="e.g. 15"
                      value={form.bufferTimeAfter}
                      onFocus={selectAllOnFocus}
                      onChange={e => setForm(f => ({ ...f, bufferTimeAfter: Number(e.target.value) }))}
                      aria-invalid={bufferError(form.bufferTimeAfter)}
                      style={bufferError(form.bufferTimeAfter)
                        ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
                        : undefined}
                    />
                    {bufferError(form.bufferTimeAfter) ? (
                      <small className="form-error" style={{ display: 'block', marginTop: 4 }}>
                        Must be a multiple of 15 — e.g. 0, 15, 30, 45…
                      </small>
                    ) : (
                      <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>15 min interval</small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Calendar Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        title={c}
                        aria-label={`Calendar color ${c}`}
                        aria-pressed={form.color === c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                {!editService ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={discardDraft} style={{ color: 'var(--gray-500)' }}>
                    Discard draft
                  </button>
                ) : <span />}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeForm}>{t('cancel')}</button>
                <button
                  id="save-service-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? <span className="spinner" /> : null}
                  {saving ? 'Saving…' : t('save')}
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
