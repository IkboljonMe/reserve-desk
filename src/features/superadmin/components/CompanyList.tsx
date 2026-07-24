'use client'

import { Pencil, Trash2, Building2, Users } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import { FEATURE_LABELS } from '@/lib/planFeatures'
import { PAYMENT_STATUS_I18N, type PaymentStatus } from '@/lib/paymentStatus'
import type { CompaniesPageState } from '../useCompaniesPage'
import Button from '@/components/ui/Button'

const EXPIRING_SOON_DAYS = 14

// Kept as its own function (not inlined in the render body) so the impure
// `Date.now()` read doesn't happen directly inside the component.
type ExpiryStatus = 'expired' | 'soon' | 'active'
function expiryStatus(expiresAt: string): ExpiryStatus {
  const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= EXPIRING_SOON_DAYS) return 'soon'
  return 'active'
}

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  unpaid: 'bg-red-100 text-red-800',
}

export function CompanyList({ s }: { s: CompaniesPageState }) {
  const { t } = useTranslation()
  const { companies, plans, loading, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete, openAccounts } = s
  const planName = (key: string) => plans.find(p => p.key === key)?.name ?? key

  if (!loading && companies.length === 0) {
    return (
      <div className="card p-0 overflow-hidden">
        <EmptyState icon={<Building2 size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noCompaniesTitle')}</h3>
          <p>{t('noCompaniesDesc')}</p>
          <Button className="mt-2" onClick={openAdd}>{t('addFirstCompany')}</Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-[0.78rem] uppercase tracking-wide border-b border-gray-100">
              <th className="p-[10px_16px] font-semibold">{t('company')}</th>
              <th className="p-[10px_16px] font-semibold">{t('plan')}</th>
              <th className="p-[10px_16px] font-semibold">{t('features')}</th>
              <th className="p-[10px_16px] font-semibold">{t('paymentStatus')}</th>
              <th className="p-[10px_16px] font-semibold">{t('expiresAt')}</th>
              <th className="p-[10px_16px] font-semibold text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2, 3].map(i => (
                <tr key={i} className="border-b border-gray-100">
                  <td colSpan={6} className="p-[12px_16px]"><div className="h-8 animate-pulse bg-gray-50" /></td>
                </tr>
              ))
            ) : (
              companies.map(c => {
                const status = expiryStatus(c.expiresAt)
                return (
                  <tr key={c._id} className="border-b border-gray-100 last:border-b-0 align-top">
                    <td className="p-[12px_16px]">
                      <div className="font-semibold text-gray-800">{c.name}</div>
                      <div className="text-[0.8rem] text-gray-500">/{c.slug}</div>
                      {c.ownerEmail && (
                        <div className="text-[0.8rem] text-gray-500 truncate max-w-60">{c.ownerEmail}</div>
                      )}
                    </td>
                    <td className="p-[12px_16px]">
                      <span className="inline-block px-2 py-0.5 text-[0.78rem] font-medium bg-gray-100 text-gray-700">
                        {planName(c.plan)}
                      </span>
                    </td>
                    <td className="p-[12px_16px]">
                      {c.features == null ? (
                        <span className="text-gray-400 text-[0.8rem]" title={t('featuresUngatedHint')}>{t('featuresAll')}</span>
                      ) : c.features.length === 0 ? (
                        <span className="text-gray-400 text-[0.8rem]">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-80">
                          {c.features.map(f => (
                            <span key={f} className="inline-block px-2 py-0.5 text-[0.72rem] font-medium bg-gray-100 text-gray-600">
                              {FEATURE_LABELS[f]}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-[12px_16px]">
                      <span className={`inline-flex items-center px-2.25 py-0.75 rounded-full text-xs font-semibold ${PAYMENT_BADGE[c.paymentStatus ?? 'pending']}`}>
                        {t(PAYMENT_STATUS_I18N[c.paymentStatus ?? 'pending'])}
                      </span>
                    </td>
                    <td className="p-[12px_16px] whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.25 py-0.75 rounded-full text-xs font-semibold ${
                          status === 'expired' ? 'bg-red-100 text-red-800' : status === 'soon' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {status === 'expired' ? t('planExpired') : new Date(c.expiresAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-[12px_16px]">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" icon size="sm" onClick={() => openAccounts(c)} title={t('loginDetails')} aria-label={t('viewLoginDetailsAria')}>
                          <Users size={14} />
                        </Button>
                        <Button variant="ghost" icon size="sm" onClick={() => openEdit(c)} title={t('edit')} aria-label={t('editCompanyAria')}>
                          <Pencil size={14} />
                        </Button>
                        {deleteConfirm === c._id ? (
                          <div className="flex gap-1 items-center">
                            <Button variant="danger" size="sm" onClick={() => handleDelete(c._id)}>{t('delete')}</Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
                          </div>
                        ) : (
                          <Button variant="ghost" icon size="sm" onClick={() => setDeleteConfirm(c._id)} title={t('delete')} aria-label={t('deleteCompanyAria')}>
                            <Trash2 size={14} color="var(--danger)" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
