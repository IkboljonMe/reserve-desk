'use client'

import { Pencil, Trash2, Users } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ClientGroupsPageState } from '../useClientGroupsPage'
import Button from '@/components/ui/Button'

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
        <EmptyState icon={<Users size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noGroupsTitle')}</h3>
          <p>{t('noGroupsDesc')}</p>
          <Button style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstGroup')}</Button>
        </EmptyState>
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
                <Button variant="ghost" icon onClick={() => openEdit(g)} title={t('edit')} aria-label={t('editGroupAria')}>
                  <Pencil size={14} />
                </Button>
                {deleteConfirm === g._id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(g._id)}>{t('delete')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
                  </div>
                ) : (
                  <Button variant="ghost" icon onClick={() => setDeleteConfirm(g._id)} title={t('delete')} aria-label={t('deleteGroupAria')}>
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
