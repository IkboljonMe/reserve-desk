'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/lib/i18n'

interface Service {
  _id: string
  name: string
  description: string
  location: string
  openTime: string
  closeTime: string
  slotDuration: number
  capacity: number
  price?: number
  isFree?: boolean
  details?: string
  color: string
  isActive: boolean
}

const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b',
  '#10b981','#06b6d4','#3b82f6','#f97316','#84cc16',
  '#64748b','#a16207',
]

const EMPTY_FORM = {
  name: '', description: '', location: '',
  openTime: '08:00', closeTime: '20:00',
  slotDuration: 60, capacity: 1, color: '#6366f1',
  price: 0, isFree: false, details: ''
}

export default function ServicesPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/services')
    const data = await res.json()
    setServices(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAddForm() {
    setEditService(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEditForm(svc: Service) {
    setEditService(svc)
    setForm({
      name: svc.name,
      description: svc.description,
      location: svc.location,
      openTime: svc.openTime,
      closeTime: svc.closeTime,
      slotDuration: svc.slotDuration,
      capacity: svc.capacity,
      price: svc.price || 0,
      isFree: svc.isFree || false,
      details: svc.details || '',
      color: svc.color,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditService(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editService ? `/api/services/${editService._id}` : '/api/services'
      const method = editService ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        showToast(editService ? 'Service updated!' : 'Service created!', 'success')
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${svc.color}25`,
                  border: `2px solid ${svc.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: svc.color }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ color: 'var(--gray-800)', fontSize: '0.9375rem' }}>{svc.name}</strong>
                    <span className={`badge ${svc.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {svc.isActive ? t('active') : t('inactive')}
                    </span>
                    {svc.isFree ? (
                      <span className="badge badge-blue">{t('isFree')}</span>
                    ) : (
                      svc.price && svc.price > 0 ? <strong style={{ color: 'var(--brand-600)', fontSize: '0.85rem' }}>uzs {svc.price.toLocaleString()}</strong> : null
                    )}
                  </div>
                  {(svc.description || svc.details) && (
                    <p style={{ fontSize: '0.8125rem', marginTop: 1, color: 'var(--gray-500)' }}>
                      {svc.description} {svc.details ? `— [${t('details')}: ${svc.details}]` : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: 4, fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    <span>🕐 {svc.openTime} – {svc.closeTime}</span>
                    <span>⏱ {svc.slotDuration}min</span>
                    <span>👥 {t('capacity')}: {svc.capacity}</span>
                    {svc.location && <span>📍 {svc.location}</span>}
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h2>{editService ? t('edit') : t('addService')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeForm}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Advanced Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
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
                    <label className="form-label">{t('location')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Advanced Row 2: Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--brand-50)', padding: 12, borderRadius: 8 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--brand-700)' }}>{t('price')} (UZS)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                      disabled={form.isFree}
                    />
                  </div>
                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={form.isFree}
                        onChange={e => setForm(f => ({ ...f, isFree: e.target.checked, price: e.target.checked ? 0 : f.price }))}
                        style={{ width: 16, height: 16 }}
                      />
                      {t('isFree')}
                    </label>
                  </div>
                </div>

                {/* Advanced Row 3: Equipment */}
                <div className="form-group">
                  <label className="form-label">{t('details')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Toyota Hiace"
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
                    <label className="form-label">Slot Duration (minutes)</label>
                    <select
                      className="form-select"
                      value={form.slotDuration}
                      onChange={e => setForm(f => ({ ...f, slotDuration: Number(e.target.value) }))}
                    >
                      {[15, 30, 45, 60, 90, 120, 180, 240, 1440].map(m => (
                        <option key={m} value={m}>{m} min{m >= 60 ? ` (${m/60}h)` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('capacity')}</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1} max={100}
                      value={form.capacity}
                      onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                    />
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
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
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
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
