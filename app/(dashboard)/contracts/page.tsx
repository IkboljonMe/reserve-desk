'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/components/ToastProvider'
import { formatUZ } from '@/lib/timezone'

type ContractStatus = 'awaiting' | 'signed' | 'terminated'

interface Contract {
  _id: string
  organizationName: string
  inn: string
  representativeName: string
  phone: string
  contractNumber: string
  signDate: string | null
  finishDate: string | null
  status: ContractStatus
  contractLink: string
  notes: string
  reminderDays: number[]
  dismissedReminders: number[]
}

type ExpiryFilter = 'all' | 'expiring' | 'expired' | 'active'
type SortKey = 'finishSoon' | 'finishLate' | 'nameAsc' | 'recent'

const EMPTY_FORM = {
  organizationName: '',
  inn: '',
  representativeName: '',
  phone: '',
  contractNumber: '',
  signDate: '',
  finishDate: '',
  status: 'awaiting' as ContractStatus,
  contractLink: '',
  notes: '',
  reminderDays: [30, 7] as number[],
}

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

// yyyy-mm-dd for <input type="date">
function toDateInput(d: string | null): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export default function ContractsPage() {
  const { showToast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | ContractStatus>('')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('finishSoon')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editContract, setEditContract] = useState<Contract | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const qs = params.toString()
      const res = await fetch(`/api/contracts${qs ? `?${qs}` : ''}`)
      const data = await res.json()
      setContracts(Array.isArray(data) ? data : [])
    } catch {
      showToast('Failed to load contracts', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, showToast])

  useEffect(() => { loadData() }, [loadData])

  function openAdd() {
    setEditContract(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(c: Contract) {
    setEditContract(c)
    setForm({
      organizationName: c.organizationName,
      inn: c.inn,
      representativeName: c.representativeName,
      phone: c.phone,
      contractNumber: c.contractNumber,
      signDate: toDateInput(c.signDate),
      finishDate: toDateInput(c.finishDate),
      status: c.status,
      contractLink: c.contractLink,
      notes: c.notes,
      reminderDays: c.reminderDays?.length ? c.reminderDays : [30, 7],
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditContract(null)
    setForm(EMPTY_FORM)
  }

  function toggleReminder(day: number) {
    setForm(f => ({
      ...f,
      reminderDays: f.reminderDays.includes(day)
        ? f.reminderDays.filter(d => d !== day)
        : [...f.reminderDays, day].sort((a, b) => b - a),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.organizationName.trim()) return
    if (form.contractLink && !/^https?:\/\//i.test(form.contractLink)) {
      showToast('Contract link must start with http:// or https://', 'error')
      return
    }
    setSaving(true)
    try {
      const url = editContract ? `/api/contracts/${editContract._id}` : '/api/contracts'
      const method = editContract ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      showToast(editContract ? 'Contract updated' : 'Contract added', 'success')
      closeModal()
      loadData()
    } catch {
      showToast('Failed to save contract', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Contract deleted', 'success')
      setDeleteConfirm(null)
      loadData()
    } else {
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

          <select className="form-select" style={{ width: 'auto', minWidth: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | ContractStatus)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="signed">Signed</option>
            <option value="awaiting">Awaiting signature</option>
            <option value="terminated">Terminated</option>
          </select>

          <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={expiryFilter} onChange={e => setExpiryFilter(e.target.value as ExpiryFilter)} aria-label="Filter by expiry">
            <option value="all">Any expiry</option>
            <option value="expiring">Expiring soon (≤30d)</option>
            <option value="expired">Expired</option>
            <option value="active">Active (&gt;30d)</option>
          </select>

          <select className="form-select" style={{ width: 'auto', minWidth: 150 }} value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} aria-label="Sort">
            <option value="finishSoon">Finish: soonest</option>
            <option value="finishLate">Finish: latest</option>
            <option value="nameAsc">Name: A–Z</option>
          </select>

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
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>{editContract ? 'Edit Contract' : 'Add Contract'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '62vh', overflowY: 'auto', paddingRight: 4 }}>
                <div className="form-group">
                  <label className="form-label">Organization name *</label>
                  <input className="form-input" required value={form.organizationName} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))} placeholder='e.g. "ANOR BANK" AJ' />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">INN</label>
                    <input className="form-input" value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value }))} placeholder="207 324 986" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract №</label>
                    <input className="form-input" value={form.contractNumber} onChange={e => setForm(f => ({ ...f, contractNumber: e.target.value }))} placeholder="SAF78" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Representative / accountant</label>
                    <input className="form-input" value={form.representativeName} onChange={e => setForm(f => ({ ...f, representativeName: e.target.value }))} placeholder="Full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Sign date</label>
                    <input className="form-input" type="date" value={form.signDate} onChange={e => setForm(f => ({ ...f, signDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Finish date</label>
                    <input className="form-input" type="date" value={form.finishDate} onChange={e => setForm(f => ({ ...f, finishDate: e.target.value }))} />
                    <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--gray-500)' }}>When the agreement ends — drives renewal reminders.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContractStatus }))}>
                    <option value="awaiting">Awaiting signature</option>
                    <option value="signed">Signed</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contract link</label>
                  <input className="form-input" type="url" value={form.contractLink} onChange={e => setForm(f => ({ ...f, contractLink: e.target.value }))} placeholder="https://drive.google.com/…" />
                  <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--gray-500)' }}>Paste a shareable link (Google Drive, etc.). Opens in a new tab.</p>
                </div>

                {/* Reminder config */}
                <div className="form-group">
                  <label className="form-label">Renewal reminders</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[30, 7].map(day => {
                      const on = form.reminderDays.includes(day)
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleReminder(day)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '7px 12px', borderRadius: 9, cursor: 'pointer',
                            fontSize: '0.8125rem', fontWeight: 600,
                            border: on ? '1px solid var(--brand-500)' : '1px solid var(--gray-200)',
                            background: on ? 'var(--brand-50)' : '#fff',
                            color: on ? 'var(--brand-700)' : 'var(--gray-500)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ display: 'inline-flex', width: 15, height: 15, borderRadius: 4, alignItems: 'center', justifyContent: 'center', background: on ? 'var(--brand-500)' : 'var(--gray-100)', color: '#fff' }}>
                            {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                          </span>
                          {day} days before
                        </button>
                      )
                    })}
                  </div>
                  <p style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                    You&apos;ll be notified on the Notifications page at each selected point before the finish date, and again once it expires.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Terms, discount rate, special conditions…" style={{ minHeight: 64 }} />
                </div>
              </div>

              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null}
                  {saving ? 'Saving…' : editContract ? 'Save Changes' : 'Add Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
