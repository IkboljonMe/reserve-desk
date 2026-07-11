'use client'

import { BedDouble, History } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import type { ClientsPageState } from '../useClientsPage'

export function ClientsTable({ s }: { s: ClientsPageState }) {
  const { t } = useTranslation()
  const { clients, loading, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete, clientGroup, setHistoryClient } = s

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <tbody><SkeletonTableRows rows={6} columns={7} /></tbody>
        </table>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>{t('noClientsYet')}</h3>
          <p>{t('noClientsDesc')}</p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstClient')}</button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
              {[['guest', t('guest')], ['group', t('group')], ['room', t('room')], ['floor', t('floor')], ['phone', t('phone')], ['notes', t('notes')], ['actions', '']].map(([key, col]) => (
                <th key={key} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => (
              <tr
                key={c._id}
                style={{
                  borderBottom: '1px solid var(--gray-100)',
                  background: i % 2 === 0 ? '#fff' : 'var(--gray-50)',
                }}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--brand-100)',
                      color: 'var(--brand-600)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                    }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {(() => {
                    const g = clientGroup(c)
                    return g ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '2px 10px', borderRadius: 20,
                        background: `${g.color}1a`, color: g.color,
                        fontWeight: 600, fontSize: '0.8125rem',
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                        {g.name}
                      </span>
                    ) : <span style={{ color: 'var(--gray-300)' }}>—</span>
                  })()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {c.roomNumber ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 10px', borderRadius: 20,
                      background: 'var(--brand-100)', color: 'var(--brand-700)',
                      fontWeight: 600, fontSize: '0.8125rem',
                    }}>
                      <BedDouble size={12} /> {c.roomNumber}
                    </span>
                  ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>
                  {c.floor > 0 ? `${t('floor')} ${c.floor}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>
                  {c.phone || <span style={{ color: 'var(--gray-300)' }}>—</span>}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--gray-500)', fontSize: '0.8125rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.notes || '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setHistoryClient(c)} title={t('bookingHistory')} aria-label={t('bookingHistory')}>
                      <History size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)} title={t('edit')} aria-label={t('editClientAria')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {deleteConfirm === c._id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>{t('delete')}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(c._id)} title={t('delete')} aria-label={t('deleteClientAria')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
