'use client'

import { Pencil, Trash2, Layers } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PlansPageState } from '../usePlansPage'
import Button from '@/components/ui/Button'

const money = (v: number) => v.toLocaleString('en-US').replace(/,/g, ' ')

export function PlanList({ s }: { s: PlansPageState }) {
  const { t } = useTranslation()
  const { plans, loading, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete } = s

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {[0, 1, 2].map(i => (
          <div key={i} className="card h-56 animate-pulse bg-gray-50" />
        ))}
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
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-stretch">
      {plans.map(p => (
        <div key={p._id} className="card flex flex-col relative">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-extrabold text-gray-800 text-[1.05rem]">{p.name}</div>
              <div className="text-[0.75rem] text-gray-400 font-mono">{p.key}</div>
            </div>
            <div className="flex gap-1 shrink-0">
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
          </div>

          <div className="mt-3 mb-1">
            <span className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-gray-900">
              {p.price > 0 ? money(p.price) : t('planFree')}
            </span>
            {p.price > 0 && <span className="text-[0.8rem] text-gray-500 font-medium"> {t('uzsPerMonth')}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
