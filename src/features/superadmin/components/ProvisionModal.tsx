'use client'

import { X, Rocket } from 'lucide-react'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { bronitLocalPart, BRONIT_DOMAIN, toBronitEmail } from '@/lib/bronitEmail'
import { FEATURE_LABELS } from '@/lib/planFeatures'
import { featuresFromLines } from '@/lib/offerings'
import type { OrdersPageState } from '../useOrdersPage'

const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

export function ProvisionModal({ s }: { s: OrdersPageState }) {
  const { t } = useTranslation()
  const { provisionTarget, provForm, setProvForm, provisioning, closeProvision, handleProvision } = s
  if (!provisionTarget) return null

  const o = provisionTarget
  const features = featuresFromLines(o.lines)

  return (
    <div className="modal-overlay" onClick={closeProvision}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2>{t('provisionBusiness')}</h2>
          <Button variant="ghost" icon onClick={closeProvision} aria-label={t('close')}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleProvision}>
          {/* What they're getting */}
          <div className="border border-gray-200 bg-gray-50 p-3 mb-4 flex flex-col gap-2">
            <div className="font-semibold text-gray-900">{o.businessName}</div>
            <div className="text-[0.85rem] text-gray-600">
              {money(o.total)} {t('sum')} · {t(o.billingCycle === 'yearly' ? 'billingYearly' : 'billingMonthly')}
            </div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {features.map(f => (
                <span key={f} className="inline-block px-2 py-0.5 text-[0.72rem] font-medium bg-white border border-gray-200 text-gray-600">
                  {FEATURE_LABELS[f]}
                </span>
              ))}
            </div>
            <p className="text-[0.78rem] text-gray-500 mt-1">{t('provisionHint')}</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">{t('email')} *</label>
              <div className="flex items-stretch">
                <input
                  className="form-input rounded-r-none"
                  required
                  autoFocus
                  value={bronitLocalPart(provForm.ownerEmail)}
                  onChange={e => setProvForm(f => ({ ...f, ownerEmail: toBronitEmail(e.target.value) }))}
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
              value={provForm.ownerPassword}
              onChange={e => setProvForm(f => ({ ...f, ownerPassword: e.target.value }))}
            />
          </div>

          <div className="h-px bg-surface-border my-4" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeProvision}>{t('cancel')}</Button>
            <Button type="submit" disabled={provisioning} leftIcon={provisioning ? <Spinner size={16} dark={false} /> : <Rocket size={15} />}>
              {provisioning ? t('provisioning') : t('provisionBusiness')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
