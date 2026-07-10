'use client'

import { Pencil, Trash2, Users } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import type { ClientGroupsPageState } from '../useClientGroupsPage'

export function GroupList({ s }: { s: ClientGroupsPageState }) {
  const { t } = useTranslation()
  const { groups, loading, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete } = s

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody><SkeletonTableRows rows={4} columns={3} /></tbody>
        </table>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={24} strokeWidth={1.75} />
          </div>
          <h3>{t('noGroupsTitle')}</h3>
          <p>{t('noGroupsDesc')}</p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstGroup')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {groups.map((g, i) => (
            <div
              key={g._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
              }}
            >
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: g.color, flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600, color: 'var(--gray-800)', flex: 1 }}>{g.name}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(g)} title={t('edit')} aria-label={t('editGroupAria')}>
                  <Pencil size={14} />
                </button>
                {deleteConfirm === g._id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}>{t('delete')}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                  </div>
                ) : (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(g._id)} title={t('delete')} aria-label={t('deleteGroupAria')}>
                    <Trash2 size={14} color="var(--danger)" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
