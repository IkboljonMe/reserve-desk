'use client'

import { Pencil, Trash2, Layers } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { FEATURE_LABELS } from '@/lib/planFeatures'
import type { PlansPageState } from '../usePlansPage'
import Button from '@/components/ui/Button'

export function PlanList({ s }: { s: PlansPageState }) {
  const { t } = useTranslation()
  const { plans, loading, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete } = s

  return (
    <div className="card p-0 overflow-hidden">
      {loading ? (
        <table className="w-full border-collapse">
          <tbody><SkeletonTableRows rows={3} columns={3} /></tbody>
        </table>
      ) : plans.length === 0 ? (
        <EmptyState icon={<Layers size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noPlansTitle')}</h3>
          <p>{t('noPlansDesc')}</p>
          <Button className="mt-2" onClick={openAdd}>{t('addPlan')}</Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col">
          {plans.map((p, i) => (
            <div
              key={p._id}
              className={`flex items-center gap-3 p-[12px_16px] ${i === 0 ? '' : 'border-t border-gray-100'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{p.name}</div>
                <div className="text-[0.8125rem] text-gray-500">{p.key}</div>
              </div>
              <div className="flex flex-wrap gap-1 max-w-[360px] justify-end">
                {p.features.length === 0 ? (
                  <span className="text-[0.8125rem] text-gray-400">{t('noFeatures')}</span>
                ) : (
                  p.features.map(f => (
                    <Badge key={f} variant="blue">{FEATURE_LABELS[f]}</Badge>
                  ))
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button variant="ghost" icon onClick={() => openEdit(p)} title={t('edit')} aria-label={t('editPlanAria')}>
                  <Pencil size={14} />
                </Button>
                {deleteConfirm === p._id ? (
                  <div className="flex gap-1 items-center">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(p._id)}>{t('delete')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
                  </div>
                ) : (
                  <Button variant="ghost" icon onClick={() => setDeleteConfirm(p._id)} title={t('delete')} aria-label={t('deletePlanAria')}>
                    <Trash2 size={14} color="var(--danger)" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
