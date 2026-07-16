'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import type { CompaniesPageState } from '../useCompaniesPage'

export function CompanyModal({ s }: { s: CompaniesPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editCompany, closeModal, handleSave, saving, form, setForm, setName, setSlug } = s
  if (!modalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2>{editCompany ? t('editCompany') : t('addCompany')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('companyName')} *</label>
              <input className="form-input" required autoFocus value={form.name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('companySlug')} *</label>
              <input className="form-input" required value={form.slug} onChange={e => setSlug(e.target.value)} />
              <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                /secure/company/{form.slug || '…'}/login
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t('plan')} *</label>
                <select className="form-input" required value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value as typeof f.plan }))}>
                  <option value="standard">Standard</option>
                  <option value="pro">Pro</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t('expiresAt')} *</label>
                <input className="form-input" type="date" required value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('contactName')}</label>
              <input className="form-input" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('contactPhone')}</label>
              <input className="form-input" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('paymentMethod')}</label>
              <input className="form-input" placeholder="Payme, Click, cash…" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} />
            </div>

            {!editCompany && (
              <>
                <div className="h-px bg-surface-border my-4" />
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-700)' }}>{t('ownerAccount')}</p>
                <div className="form-group">
                  <label className="form-label">{t('fullName')} *</label>
                  <input className="form-input" required value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('email')} *</label>
                  <input className="form-input" type="email" required value={form.ownerEmail} onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('password')} *</label>
                  <input className="form-input" type="password" required value={form.ownerPassword} onChange={e => setForm(f => ({ ...f, ownerPassword: e.target.value }))} />
                </div>
              </>
            )}
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t('saving') : editCompany ? t('save') : t('addCompany')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
