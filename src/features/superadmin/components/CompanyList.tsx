'use client'

import { Pencil, Trash2, Building2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
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
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 size={24} strokeWidth={1.75} />
          </div>
          <h3>{t('noCompaniesTitle')}</h3>
          <p>{t('noCompaniesDesc')}</p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstCompany')}</button>
        </div>
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
                <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', flexShrink: 0 }}>
                  {PLAN_LABEL[c.plan] ?? c.plan}
                </span>
                <span
                  className="badge"
                  style={{
                    flexShrink: 0,
                    background: expired ? '#fee2e2' : '#dcfce7',
                    color: expired ? '#991b1b' : '#166534',
                  }}
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
