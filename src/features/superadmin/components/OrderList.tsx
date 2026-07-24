'use client'

import { Pencil, Trash2, ShoppingCart, Rocket, CheckCircle2 } from 'lucide-react'
import { useTranslation, type DictionaryKeys } from '@/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import type { OrderStatus } from '@/lib/api/orders'
import type { OrdersPageState } from '../useOrdersPage'
import Button from '@/components/ui/Button'

const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

const STATUS_BADGE: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  accepted: 'bg-blue-100 text-blue-800',
  provisioned: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}
const STATUS_I18N: Record<OrderStatus, DictionaryKeys> = {
  draft: 'orderStatusDraft',
  accepted: 'orderStatusAccepted',
  provisioned: 'orderStatusProvisioned',
  cancelled: 'orderStatusCancelled',
}

export function OrderList({ s }: { s: OrdersPageState }) {
  const { t } = useTranslation()
  const { orders, loading, openAdd, openEdit, openProvision, deleteConfirm, setDeleteConfirm, handleDelete } = s

  if (!loading && orders.length === 0) {
    return (
      <div className="card p-0 overflow-hidden">
        <EmptyState icon={<ShoppingCart size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noSalesOrdersTitle')}</h3>
          <p>{t('noSalesOrdersDesc')}</p>
          <Button className="mt-2" onClick={openAdd}>{t('newOrder')}</Button>
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
              <th className="p-[10px_16px] font-semibold">{t('business')}</th>
              <th className="p-[10px_16px] font-semibold">{t('amount')}</th>
              <th className="p-[10px_16px] font-semibold">{t('paymentMethod')}</th>
              <th className="p-[10px_16px] font-semibold">{t('status')}</th>
              <th className="p-[10px_16px] font-semibold text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2].map(i => (
                <tr key={i} className="border-b border-gray-100">
                  <td colSpan={5} className="p-[12px_16px]"><div className="h-8 animate-pulse bg-gray-50" /></td>
                </tr>
              ))
            ) : (
              orders.map(o => (
                <tr key={o._id} className="border-b border-gray-100 last:border-b-0 align-top">
                  <td className="p-[12px_16px]">
                    <div className="font-semibold text-gray-800">{o.businessName}</div>
                    {o.contactName && <div className="text-[0.8rem] text-gray-500">{o.contactName}</div>}
                    {o.contactPhone && <div className="text-[0.8rem] text-gray-500">{o.contactPhone}</div>}
                  </td>
                  <td className="p-[12px_16px] whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{money(o.total)} <span className="text-[0.72rem] text-gray-500 font-medium">{t('sum')}</span></div>
                    <div className="text-[0.75rem] text-gray-500">
                      {t(o.billingCycle === 'yearly' ? 'billingYearly' : 'billingMonthly')}
                      {o.discountPercent > 0 && <span className="text-emerald-600 font-medium"> · −{o.discountPercent}%</span>}
                    </div>
                  </td>
                  <td className="p-[12px_16px]">
                    <div className="text-gray-700">{o.paymentMethod || '—'}</div>
                    {o.paymentDate && <div className="text-[0.78rem] text-gray-500">{new Date(o.paymentDate).toLocaleDateString()}</div>}
                  </td>
                  <td className="p-[12px_16px]">
                    <span className={`inline-flex items-center px-2.25 py-0.75 rounded-full text-xs font-semibold ${STATUS_BADGE[o.status]}`}>
                      {t(STATUS_I18N[o.status])}
                    </span>
                  </td>
                  <td className="p-[12px_16px]">
                    <div className="flex gap-1 justify-end items-center">
                      {o.status === 'provisioned' ? (
                        <span className="inline-flex items-center gap-1 text-[0.78rem] text-green-700 font-medium px-2">
                          <CheckCircle2 size={14} /> {t('orderStatusProvisioned')}
                        </span>
                      ) : (
                        <>
                          <Button variant="primary" size="sm" leftIcon={<Rocket size={13} />} onClick={() => openProvision(o)}>
                            {t('provisionBusiness')}
                          </Button>
                          <Button variant="ghost" icon size="sm" onClick={() => openEdit(o)} title={t('edit')} aria-label={t('editOrderAria')}>
                            <Pencil size={14} />
                          </Button>
                        </>
                      )}
                      {deleteConfirm === o._id ? (
                        <div className="flex gap-1 items-center">
                          <Button variant="danger" size="sm" onClick={() => handleDelete(o._id)}>{t('delete')}</Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" icon size="sm" onClick={() => setDeleteConfirm(o._id)} title={t('delete')} aria-label={t('deleteOrderAria')}>
                          <Trash2 size={14} color="var(--danger)" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
