'use client'

import { Pencil, Trash2, Building2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import type { CompaniesPageState } from '../useCompaniesPage'

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
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody><SkeletonTableRows rows={4} columns={4} /></tbody>
        </table>
      ) : companies.length === 0 ? (
        <EmptyState icon={<Building2 size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noCompaniesTitle')}</h3>
          <p>{t('noCompaniesDesc')}</p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstCompany')}</button>
        </EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {companies.map((c, i) => {
            const expired = isExpired(c.expiresAt)
            return (
              <div
                key={c._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>/{c.slug}</div>
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
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)} title={t('edit')} aria-label={t('editCompanyAria')}>
                    <Pencil size={14} />
                  </button>
                  {deleteConfirm === c._id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>{t('delete')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(c._id)} title={t('delete')} aria-label={t('deleteCompanyAria')}>
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
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
