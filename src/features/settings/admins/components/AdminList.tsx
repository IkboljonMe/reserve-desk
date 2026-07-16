'use client'

import { Pencil, Trash2, ShieldCheck } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import type { AdminsPageState } from '../useAdminsPage'
import Button from '@/components/ui/Button'

export function AdminList({ s }: { s: AdminsPageState }) {
  const { t } = useTranslation()
  const { admins, loading, noHotels, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete } = s

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody><SkeletonTableRows rows={4} columns={3} /></tbody>
        </table>
      ) : admins.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={24} strokeWidth={1.75} />}>
          <h3 className="text-gray-700">{t('noAdminsTitle')}</h3>
          <p>{noHotels ? t('addHotelFirst') : t('noAdminsDesc')}</p>
          {!noHotels && (
            <Button style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstAdmin')}</Button>
          )}
        </EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {admins.map((a, i) => (
            <div
              key={a._id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{a.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{a.email}</div>
              </div>
              <Badge variant="gray" className="shrink-0">
                {a.hotelId ? `${a.hotelId.name} (${a.hotelId.shortName})` : t('noHotelAssigned')}
              </Badge>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="ghost" icon onClick={() => openEdit(a)} title={t('edit')} aria-label={t('editAdminAria')}>
                  <Pencil size={14} />
                </Button>
                {deleteConfirm === a._id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(a._id)}>{t('delete')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</Button>
                  </div>
                ) : (
                  <Button variant="ghost" icon onClick={() => setDeleteConfirm(a._id)} title={t('delete')} aria-label={t('deleteAdminAria')}>
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
