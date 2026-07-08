'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { AdminsPageState } from '../useAdminsPage'

export function AdminModal({ s }: { s: AdminsPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editAdmin, closeModal, handleSave, saving, form, setForm, hotels } = s
  if (!modalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>{editAdmin ? t('editAdmin') : t('addAdmin')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('fullName')} *</label>
              <input className="form-input" required autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('email')} *</label>
              <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('password')} {editAdmin ? '' : '*'}</label>
              <input
                className="form-input"
                type="password"
                required={!editAdmin}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              {editAdmin && (
                <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--gray-500)' }}>{t('passwordKeepHint')}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t('hotel')} *</label>
              <select className="form-input" required value={form.hotelId} onChange={e => setForm(f => ({ ...f, hotelId: e.target.value }))}>
                <option value="" disabled>{t('selectHotel')}</option>
                {hotels.map(h => (
                  <option key={h._id} value={h._id}>{h.name} ({h.shortName})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? t('saving') : editAdmin ? t('save') : t('addAdmin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
