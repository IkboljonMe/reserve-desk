'use client'

import { useTranslation } from '@/i18n'
import type { ClientsPageState } from '../useClientsPage'

export function ClientModal({ s }: { s: ClientsPageState }) {
  const { t } = useTranslation()
  const {
    modalOpen, editClient, closeModal, handleSave, saving,
    form, setForm, modalGroups,
  } = s
  if (!modalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editClient ? t('editClientTitle') : t('addClient')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label={t('close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('fullName')} *</label>
              <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('fullNamePlaceholder')} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('group')}</label>
              <select
                className="form-select"
                value={form.groupId}
                onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
              >
                <option value="">{t('noGroup')}</option>
                {modalGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
              {modalGroups.length === 0 && (
                <p style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  {t('noGroupsYet')}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" />
            </div>

            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('notesClientPlaceholder')} style={{ minHeight: 72 }} />
            </div>
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? t('saving') : editClient ? t('save') : t('addClient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
