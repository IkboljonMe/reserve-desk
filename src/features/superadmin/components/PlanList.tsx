'use client'

import { Pencil, Trash2, Layers } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import { FEATURE_LABELS } from '@/lib/planFeatures'
import type { PlansPageState } from '../usePlansPage'
import Button from '@/components/ui/Button'

const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

export function PlanList({ s }: { s: PlansPageState }) {
  const { t } = useTranslation()
  const { plans, loading, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete } = s

  if (loading) {
    return (
      <div className="card p-4">
        <div className="h-40 animate-pulse bg-gray-50" />
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="card p-0 overflow-hidden">
        <EmptyState icon={<Layers size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noPlansTitle')}</h3>
          <p>{t('noPlansDesc')}</p>
          <Button className="mt-2" onClick={openAdd}>{t('addPlan')}</Button>
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
              <th className="p-[10px_16px] font-semibold">{t('planName')}</th>
              <th className="p-[10px_16px] font-semibold">{t('planPrice')}</th>
              <th className="p-[10px_16px] font-semibold">{t('planFeatures')}</th>
              <th className="p-[10px_16px] font-semibold text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p._id} className="border-b border-gray-100 last:border-b-0 align-top">
                <td className="p-[12px_16px]">
                  <div className="font-semibold text-gray-800">{p.name}</div>
                  <div className="text-[0.75rem] text-gray-400 font-mono">{p.key}</div>
                </td>
                <td className="p-[12px_16px] whitespace-nowrap">
                  {p.price > 0 ? (
                    <span className="font-semibold text-gray-900">
                      {money(p.price)}<span className="text-[0.75rem] text-gray-500 font-medium"> {t('uzsPerMonth')}</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">{t('planFree')}</span>
                  )}
                </td>
                <td className="p-[12px_16px]">
                  {p.features && p.features.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-90">
                      {p.features.map(f => (
                        <span key={f} className="inline-block px-2 py-0.5 text-[0.72rem] font-medium bg-gray-100 text-gray-600">
                          {FEATURE_LABELS[f]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-[0.8rem]">—</span>
                  )}
                </td>
                <td className="p-[12px_16px]">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" icon size="sm" onClick={() => openEdit(p)} title={t('edit')} aria-label={t('editPlanAria')}>
                      <Pencil size={14} />
                    </Button>
                    {deleteConfirm === p._id ? (
                      <div className="flex gap-1 items-center">
                        <Button variant="danger" size="sm" onClick={() => handleDelete(p._id)}>{t('delete')}</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" icon size="sm" onClick={() => setDeleteConfirm(p._id)} title={t('delete')} aria-label={t('deletePlanAria')}>
                        <Trash2 size={14} color="var(--danger)" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
