'use client'

import { useTranslation } from '@/i18n'
import { STATUS_META } from '../constants'
import { daysLeftOf, fmtDate } from '../utils'
import { ExpiryPill } from './ExpiryPill'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import type { ContractsPageState } from '../useContractsPage'

export function ContractsTable({ s }: { s: ContractsPageState }) {
  const { t } = useTranslation()
  const { contracts, visible, loading, multiHotel, hotelLabel, openAdd, openEdit, deleteConfirm, setDeleteConfirm, handleDelete } = s

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <tbody><SkeletonTableRows rows={6} columns={multiHotel ? 8 : 7} /></tbody>
        </table>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
          <h3>{contracts.length === 0 ? t('noContractsYet') : t('noContractsMatch')}</h3>
          <p>{contracts.length === 0 ? t('noContractsDesc') : t('tryClearFilters')}</p>
          {contracts.length === 0 && <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstContract')}</button>}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 920 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                {([
                  ['organization', t('organization')],
                  ...(multiHotel ? [['hotel', t('hotel')]] : []),
                  ['contractNo', t('contractNo')], ['representative', t('representative')], ['status', t('status')], ['finishDate', t('finishDate')], ['renewal', t('renewal')], ['link', t('link')], ['actions', ''],
                ] as [string, string][]).map(([key, label]) => (
                  <th key={key} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((c, i) => {
                const dl = daysLeftOf(c.finishDate)
                const sm = STATUS_META[c.status]
                return (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--gray-100)', background: i % 2 === 0 ? '#fff' : 'var(--gray-50)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--brand-100)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                          {c.organizationName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{c.organizationName}</div>
                          {c.inn && <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{t('inn')} {c.inn}</div>}
                        </div>
                      </div>
                    </td>
                    {multiHotel && (
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 20, background: 'var(--gray-100)', color: 'var(--gray-700)', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {hotelLabel(c.hotelId)}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', color: 'var(--gray-700)', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.contractNumber || <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>
                      {c.representativeName ? (
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{c.representativeName}</div>
                          {c.phone && <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{c.phone}</div>}
                        </div>
                      ) : (c.phone || <span style={{ color: 'var(--gray-300)' }}>—</span>)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 20, background: sm.bg, color: sm.color, fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sm.color }} />
                        {t(sm.labelKey)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>{fmtDate(c.finishDate)}</td>
                    <td style={{ padding: '12px 16px' }}><ExpiryPill status={c.status} daysLeft={dl} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.contractLink ? (
                        <a href={c.contractLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ gap: 6, color: 'var(--brand-600)' }} title={c.contractLink}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          {t('openLink')}
                        </a>
                      ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)} title={t('edit')} aria-label={t('editContractAria')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {deleteConfirm === c._id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>{t('delete')}</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(c._id)} title={t('delete')} aria-label={t('deleteContractAria')}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
