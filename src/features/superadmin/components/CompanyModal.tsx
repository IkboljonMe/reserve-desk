'use client'

import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import { bronitLocalPart, BRONIT_DOMAIN } from '@/lib/bronitEmail'
import { PAYMENT_STATUSES, PAYMENT_STATUS_I18N } from '@/lib/paymentStatus'
import type { CompaniesPageState } from '../useCompaniesPage'
import Button from '@/components/ui/Button'
import { FeatureCheckboxes } from './FeatureCheckboxes'

export function CompanyModal({ s }: { s: CompaniesPageState }) {
  const { t } = useTranslation()
  const { modalOpen, editCompany, closeModal, handleSave, saving, form, setForm, setName, setPlan, toggleFeature, setOwnerEmailLocalPart, plans } = s
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
            <Input
              label={`${t('companyName')} *`}
              required
              autoFocus
              value={form.name}
              onChange={e => setName(e.target.value)}
            />

            <div className="flex gap-3">
              <div className="form-group flex-1">
                <label className="form-label">{t('plan')} *</label>
                <select className="form-input" required value={form.plan} onChange={e => setPlan(e.target.value)}>
                  {plans.map(p => (
                    <option key={p._id} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </div>
              <Input
                containerClassName="flex-1"
                label={`${t('expiresAt')} *`}
                type="date"
                required
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>

            <FeatureCheckboxes label={t('features')} value={form.features} onToggle={toggleFeature} />

            <div className="flex gap-3">
              <div className="form-group flex-1">
                <label className="form-label">{t('paymentStatus')}</label>
                <select
                  className="form-input"
                  value={form.paymentStatus}
                  onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value as typeof f.paymentStatus }))}
                >
                  {PAYMENT_STATUSES.map(st => (
                    <option key={st} value={st}>{t(PAYMENT_STATUS_I18N[st])}</option>
                  ))}
                </select>
              </div>
              <Input
                containerClassName="flex-1"
                label={t('paymentMethod')}
                placeholder="Payme, Click, cash…"
                value={form.paymentMethod}
                onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
              />
            </div>

            <Input
              label={`${t('fullName')} *`}
              required
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            />
            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <textarea className="form-input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>

            {!editCompany && (
              <>
                <div className="h-px bg-surface-border my-1" />
                <p className="text-[0.8125rem] font-semibold text-gray-700">{t('ownerAccount')}</p>
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
                <Input
                  label={`${t('password')} *`}
                  type="password"
                  required
                  value={form.ownerPassword}
                  onChange={e => setForm(f => ({ ...f, ownerPassword: e.target.value }))}
                />
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
