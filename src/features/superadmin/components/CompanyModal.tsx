'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import { bronitLocalPart, BRONIT_DOMAIN } from '@/lib/bronitEmail'
import type { CompaniesPageState } from '../useCompaniesPage'
import Button from '@/components/ui/Button'

export function CompanyModal({ s }: { s: CompaniesPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editCompany, closeModal, handleSave, saving, form, setForm, setName, setSlug, setOwnerEmailLocalPart, plans } = s
  if (!modalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2>{editCompany ? t('editCompany') : t('addCompany')}</h2>
          <Button variant="ghost" icon onClick={closeModal} aria-label={t('close')}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">{t('companyName')} *</label>
              <input className="form-input" required autoFocus value={form.name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('companySlug')} *</label>
              <input className="form-input" required value={form.slug} onChange={e => setSlug(e.target.value)} />
              <p className="mt-1 text-[0.75rem] text-gray-500">
                /secure/company/{form.slug || '…'}/login
              </p>
            </div>

            <div className="flex gap-3">
              <div className="form-group flex-1">
                <label className="form-label">{t('plan')} *</label>
                <select className="form-input" required value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                  {plans.map(p => (
                    <option key={p._id} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group flex-1">
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
                <div className="h-px bg-surface-border my-1" />
                <p className="text-[0.8125rem] font-semibold text-gray-700">{t('ownerAccount')}</p>
                <div className="form-group">
                  <label className="form-label">{t('fullName')} *</label>
                  <input className="form-input" required value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('email')} *</label>
                  <div className="flex items-stretch">
                    <input
                      className="form-input rounded-r-none"
                      required
                      value={bronitLocalPart(form.ownerEmail)}
                      onChange={e => setOwnerEmailLocalPart(e.target.value)}
                    />
                    <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">
                      {BRONIT_DOMAIN}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('password')} *</label>
                  <input className="form-input" type="password" required value={form.ownerPassword} onChange={e => setForm(f => ({ ...f, ownerPassword: e.target.value }))} />
                </div>
              </>
            )}
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeModal}>{t('cancel')}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={18} dark={false} /> : null}
              {saving ? t('saving') : editCompany ? t('save') : t('addCompany')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
