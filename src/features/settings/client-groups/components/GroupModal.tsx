'use client'

import { Check, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { PRESET_COLORS } from '../useClientGroupsPage'
import type { ClientGroupsPageState } from '../useClientGroupsPage'

export function GroupModal({ s }: { s: ClientGroupsPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editGroup, closeModal, handleSave, saving, form, setForm } = s
  if (!modalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>{editGroup ? t('editGroup') : t('addGroup')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('groupName')} *</label>
              <input className="form-input" required autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('groupNamePlaceholder')} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('color')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    aria-label={t('selectColor', { color: c })}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: c, cursor: 'pointer',
                      border: form.color === c ? '2px solid var(--gray-800)' : '2px solid transparent',
                      outline: form.color === c ? '2px solid #fff' : 'none',
                      outlineOffset: -4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {form.color === c && <Check size={14} color="#fff" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? t('saving') : editGroup ? t('save') : t('addGroup')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
