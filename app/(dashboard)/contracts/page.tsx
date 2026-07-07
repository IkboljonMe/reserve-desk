'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/components/ToastProvider'
import { formatUZ } from '@/lib/timezone'
import Dropdown from '@/components/ui/Dropdown'
import ContractModal, { Contract, ContractStatus } from '@/components/contracts/ContractModal'
import {
  useContractsQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
} from '@/hooks/useContracts'

type ExpiryFilter = 'all' | 'expiring' | 'expired' | 'active'
type SortKey = 'finishSoon' | 'finishLate' | 'nameAsc' | 'recent'

const STATUS_META: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  signed: { label: 'Signed', color: '#0f9d58', bg: 'rgba(16,185,129,0.14)' },
  awaiting: { label: 'Awaiting signature', color: '#b7791f', bg: 'rgba(245,158,11,0.15)' },
  terminated: { label: 'Terminated', color: '#6b7584', bg: 'rgba(107,117,132,0.14)' },
}

// Whole-day difference to the finish date in local terms. Negative = expired.
function daysLeftOf(finishDate: string | null): number | null {
  if (!finishDate) return null
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const f = new Date(finishDate)
  const target = Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate())
  return Math.round((target - today) / 86_400_000)
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return formatUZ(d, { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ContractsPage() {
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | ContractStatus>('')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('finishSoon')
  const [modalOpen, setModalOpen] = useState(false)
  const [editContract, setEditContract] = useState<Contract | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: contracts = [], isLoading: loading } = useContractsQuery(search, statusFilter)

  const createMutation = useCreateContractMutation()
  const updateMutation = useUpdateContractMutation()
  const deleteMutation = useDeleteContractMutation()

  const saving = createMutation.isPending || updateMutation.isPending

  function openAdd() {
    setEditContract(null)
    setModalOpen(true)
  }

  function openEdit(c: Contract) {
    setEditContract(c)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditContract(null)
  }

  async function handleSave(form: any) {
    if (!form.organizationName.trim()) return
    if (form.contractLink && !/^https?:\/\//i.test(form.contractLink)) {
      showToast('Contract link must start with http:// or https://', 'error')
      return
    }
    try {
      if (editContract) {
        await updateMutation.mutateAsync({ id: editContract._id, data: form })
      } else {
        await createMutation.mutateAsync(form)
      }
      showToast(editContract ? 'Contract updated' : 'Contract added', 'success')
      closeModal()
    } catch {
      showToast('Failed to save contract', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      showToast('Contract deleted', 'success')
      setDeleteConfirm(null)
    } catch {
      showToast('Failed to delete', 'error')
    }
  }

  // ---- Client-side derived filtering + sorting + stats ----
  const stats = useMemo(() => {
    let signed = 0, expiring = 0, expired = 0
    for (const c of contracts) {
      if (c.status === 'signed') signed++
      const dl = daysLeftOf(c.finishDate)
      if (c.status !== 'terminated' && dl !== null) {
        if (dl < 0) expired++
        else if (dl <= 30) expiring++
      }
    }
    return { total: contracts.length, signed, expiring, expired }
  }, [contracts])

  const visible = useMemo(() => {
    let list = contracts.filter(c => {
      const dl = daysLeftOf(c.finishDate)
      if (expiryFilter === 'expiring') return c.status !== 'terminated' && dl !== null && dl >= 0 && dl <= 30
      if (expiryFilter === 'expired') return c.status !== 'terminated' && dl !== null && dl < 0
      if (expiryFilter === 'active') return c.status !== 'terminated' && dl !== null && dl > 30
      return true
    })
    list = [...list].sort((a, b) => {
      const da = daysLeftOf(a.finishDate)
      const db = daysLeftOf(b.finishDate)
      switch (sortKey) {
        case 'finishSoon':
          if (da === null) return 1
          if (db === null) return -1
          return da - db
        case 'finishLate':
          if (da === null) return 1
          if (db === null) return -1
          return db - da
        case 'nameAsc':
          return a.organizationName.localeCompare(b.organizationName)
        case 'recent':
          return 0
        default:
          return 0
      }
    })
    return list
  }, [contracts, expiryFilter, sortKey])

  const activeFilterCount = (statusFilter ? 1 : 0) + (expiryFilter !== 'all' ? 1 : 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Contracts</h1>
          <p style={{ marginTop: 4 }}>Partner organizations, their agreements, and renewal reminders</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Contract
        </button>
      </div>

      {/* KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1rem' }}>
        <StatCard label="Total contracts" value={stats.total} tint="var(--brand-600)" tintBg="var(--brand-100)" icon="doc" />
        <StatCard label="Signed" value={stats.signed} tint="#0f9d58" tintBg="rgba(16,185,129,0.14)" icon="check" />
        <StatCard label="Expiring ≤ 30 days" value={stats.expiring} tint="#b7791f" tintBg="rgba(245,158,11,0.16)" icon="clock" />
        <StatCard label="Expired" value={stats.expired} tint="var(--danger)" tintBg="rgba(239,68,68,0.13)" icon="alert" />
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="form-input"
              style={{ border: 'none', padding: '0 4px', boxShadow: 'none' }}
              placeholder="Search organization, INN, contract №, representative…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 150 }}>
            <Dropdown
              value={statusFilter}
              onChange={val => setStatusFilter(val as '' | ContractStatus)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'signed', label: 'Signed' },
                { value: 'awaiting', label: 'Awaiting signature' },
                { value: 'terminated', label: 'Terminated' },
              ]}
              ariaLabel="Filter by status"
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <Dropdown
              value={expiryFilter}
              onChange={val => setExpiryFilter(val as ExpiryFilter)}
              options={[
                { value: 'all', label: 'Any expiry' },
                { value: 'expiring', label: 'Expiring soon (≤30d)' },
                { value: 'expired', label: 'Expired' },
                { value: 'active', label: 'Active (>30d)' },
              ]}
              ariaLabel="Filter by expiry"
            />
          </div>

          <div style={{ minWidth: 150 }}>
            <Dropdown
              value={sortKey}
              onChange={val => setSortKey(val as SortKey)}
              options={[
                { value: 'finishSoon', label: 'Finish: soonest' },
                { value: 'finishLate', label: 'Finish: latest' },
                { value: 'nameAsc', label: 'Name: A–Z' },
              ]}
              ariaLabel="Sort"
            />
          </div>

          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setStatusFilter(''); setExpiryFilter('all') }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>
              </svg>
            </div>
            <h3>{contracts.length === 0 ? 'No contracts yet' : 'No contracts match your filters'}</h3>
            <p>{contracts.length === 0 ? 'Add your partner organizations and track when their agreements expire.' : 'Try clearing the filters or adjusting your search.'}</p>
            {contracts.length === 0 && <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>Add First Contract</button>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 920 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                  {['Organization', 'Contract №', 'Representative', 'Status', 'Finish date', 'Renewal', 'Link', ''].map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{col}</th>
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
                            {c.inn && <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>INN {c.inn}</div>}
                          </div>
                        </div>
                      </td>
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
                          {sm.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>{fmtDate(c.finishDate)}</td>
                      <td style={{ padding: '12px 16px' }}><ExpiryPill status={c.status} daysLeft={dl} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.contractLink ? (
                          <a href={c.contractLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ gap: 6, color: 'var(--brand-600)' }} title={c.contractLink}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            Open
                          </a>
                        ) : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit" aria-label="Edit contract">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {deleteConfirm === c._id ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Delete</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            </div>
                          ) : (
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(c._id)} title="Delete" aria-label="Delete contract">
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

      {!loading && visible.length > 0 && (
        <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--gray-400)' }}>
          Showing {visible.length} of {contracts.length} contract{contracts.length === 1 ? '' : 's'}
        </p>
      )}

      {/* Add / Edit modal */}
      <ContractModal
        isOpen={modalOpen}
        editContract={editContract}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}

function ExpiryPill({ status, daysLeft }: { status: ContractStatus; daysLeft: number | null }) {
  if (status === 'terminated') return <span style={{ color: 'var(--gray-300)' }}>—</span>
  if (daysLeft === null) return <span style={{ color: 'var(--gray-300)' }}>No date</span>

  let color = '#0f9d58', bg = 'rgba(16,185,129,0.12)', label = `${daysLeft} days left`
  if (daysLeft < 0) { color = 'var(--danger)'; bg = 'rgba(239,68,68,0.12)'; label = `Expired ${Math.abs(daysLeft)}d ago` }
  else if (daysLeft === 0) { color = 'var(--danger)'; bg = 'rgba(239,68,68,0.12)'; label = 'Expires today' }
  else if (daysLeft <= 7) { color = '#c2410c'; bg = 'rgba(234,88,12,0.12)'; label = `${daysLeft} days left` }
  else if (daysLeft <= 30) { color = '#b7791f'; bg = 'rgba(245,158,11,0.15)'; label = `${daysLeft} days left` }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 20, background: bg, color, fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
      {label}
    </span>
  )
}

function StatCard({ label, value, tint, tintBg, icon }: { label: string; value: number; tint: string; tintBg: string; icon: 'doc' | 'check' | 'clock' | 'alert' }) {
  const paths: Record<typeof icon, React.ReactNode> = {
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  }
  return (
    <div className="card" style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: tintBg, color: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[icon]}</svg>
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}
