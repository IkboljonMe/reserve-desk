'use client'

import { Pencil, Trash2, Building2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import type { CompaniesPageState } from '../useCompaniesPage'
import Button from '@/components/ui/Button'

const PLAN_LABEL: Record<string, string> = { standard: 'Standard', pro: 'Pro', vip: 'VIP' }

// Kept as its own function (not inlined in the render body) so the impure
// `Date.now()` read doesn't happen directly inside the component.
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now()
}

export function CompanyList({ s }: { s: CompaniesPageState }) {
  const { t } = useTranslation()
  const { companies, loading, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete } = s

  return (
    <div className="card p-0 overflow-hidden">
      {loading ? (
        <table className="w-full border-collapse">
          <tbody><SkeletonTableRows rows={4} columns={4} /></tbody>
        </table>
      ) : companies.length === 0 ? (
        <EmptyState icon={<Building2 size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noCompaniesTitle')}</h3>
          <p>{t('noCompaniesDesc')}</p>
          <Button className="mt-2" onClick={openAdd}>{t('addFirstCompany')}</Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col">
          {companies.map((c, i) => {
            const expired = isExpired(c.expiresAt)
            return (
              <div
                key={c._id}
                className={`flex items-center gap-3 p-[12px_16px] ${i === 0 ? '' : 'border-t border-gray-100'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800">{c.name}</div>
                  <div className="text-[0.8125rem] text-gray-500">/{c.slug}</div>
                </div>
                <Badge variant="gray" className="shrink-0">
                  {PLAN_LABEL[c.plan] ?? c.plan}
                </Badge>
                <span
                  className={`inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-xs font-semibold tracking-[0.01em] border border-transparent shrink-0 ${
                    expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {expired ? t('planExpired') : t('planActiveUntil') + ' ' + new Date(c.expiresAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1.5">
                  <Button variant="ghost" icon onClick={() => openEdit(c)} title={t('edit')} aria-label={t('editCompanyAria')}>
                    <Pencil size={14} />
                  </Button>
                  {deleteConfirm === c._id ? (
                    <div className="flex gap-1 items-center">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(c._id)}>{t('delete')}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" icon onClick={() => setDeleteConfirm(c._id)} title={t('delete')} aria-label={t('deleteCompanyAria')}>
                      <Trash2 size={14} color="var(--danger)" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
