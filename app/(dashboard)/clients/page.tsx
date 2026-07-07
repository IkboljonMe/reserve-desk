'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/lib/i18n'

interface Room {
  _id: string
  hotelId: string
  number: string
  floor: number
}

interface Hotel {
  _id: string
  shortName: string
}

interface ClientGroup {
  _id: string
  name: string
  color: string
}

interface Client {
  _id: string
  name: string
  phone: string
  roomNumber: string
  floor: number
  notes: string
  groupId: ClientGroup | string | null
}

const EMPTY_FORM = { name: '', phone: '', roomNumber: '', floor: 1, notes: '', groupId: '' }

// groupId comes back populated (object) on GET but is a raw id/string elsewhere.
function extractGroupId(groupId: Client['groupId']): string {
  if (!groupId) return ''
  if (typeof groupId === 'string') return groupId
  return groupId._id ?? ''
}

export default function ClientsPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [clients, setClients] = useState<Client[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [groups, setGroups] = useState<ClientGroup[]>([])
  const [groupFilter, setGroupFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (groupFilter) params.set('groupId', groupFilter)
      const qs = params.toString()
      const [cr, rr, hr, gr] = await Promise.all([
        fetch(`/api/clients${qs ? `?${qs}` : ''}`),
        fetch('/api/rooms'),
        fetch('/api/hotels'),
        fetch('/api/client-groups'),
      ])
      const [c, r, h, g] = await Promise.all([cr.json(), rr.json(), hr.json(), gr.json()])
      setClients(Array.isArray(c) ? c : [])
      setRooms(Array.isArray(r) ? r : [])
      setHotels(Array.isArray(h) ? h : [])
      setGroups(Array.isArray(g) ? g : [])
    } catch {
      showToast(t('loadClientsFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [search, groupFilter, showToast, t])

  useEffect(() => { loadData() }, [loadData])

  function openAdd() {
    setEditClient(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(c: Client) {
    setEditClient(c)
    setForm({ name: c.name, phone: c.phone, roomNumber: c.roomNumber, floor: c.floor, notes: c.notes, groupId: extractGroupId(c.groupId) })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditClient(null)
    setForm(EMPTY_FORM)
  }

  // Room display name uses the hotel's compact code, e.g. "FG-202".
  function roomLabel(r: Room) {
    const sn = hotels.find(h => h._id === r.hotelId)?.shortName || '??'
    return `${sn}-${r.number}`
  }

  // Auto-fill floor when a room is picked. The stored value is the full label.
  function handleRoomChange(roomNumber: string) {
    const room = rooms.find(r => roomLabel(r) === roomNumber)
    setForm(f => ({ ...f, roomNumber, floor: room ? room.floor : f.floor }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editClient ? `/api/clients/${editClient._id}` : '/api/clients'
      const method = editClient ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      showToast(editClient ? t('clientUpdated') : t('clientAdded'), 'success')
      closeModal()
      loadData()
    } catch {
      showToast(t('saveClientFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t('clientDeleted'), 'success')
      setDeleteConfirm(null)
      loadData()
    } else {
      showToast(t('deleteFailed'), 'error')
    }
  }

  // Group by floor for display
  const floorGroups = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b)

  // Resolve the full group record for a client (works whether populated or id).
  function clientGroup(c: Client): ClientGroup | null {
    const id = extractGroupId(c.groupId)
    if (!id) return null
    if (typeof c.groupId === 'object' && c.groupId) return c.groupId
    return groups.find(g => g._id === id) || null
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t('clients')}</h1>
          <p style={{ marginTop: 4 }}>{t('manageClients')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          {t('addClient')}
        </button>
      </div>

      {/* Search + group filter */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="form-input"
              style={{ border: 'none', padding: '0 4px', boxShadow: 'none' }}
              placeholder={t('searchClientsPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 160 }}
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            aria-label={t('filterByGroup')}
          >
            <option value="">{t('allGroups')}</option>
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            <option value="none">{t('ungrouped')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
          </div>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
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
                        🏨 {c.roomNumber}
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
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editClient ? t('editClientTitle') : t('addClient')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label={t('close')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('fullName')} *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('fullNamePlaceholder')} />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('group')}</label>
                  <select
                    className="form-select"
                    value={form.groupId}
                    onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
                  >
                    <option value="">{t('noGroup')}</option>
                    {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                  {groups.length === 0 && (
                    <p style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {t('noGroupsYet')}
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{t('roomNumberField')}</label>
                    <select
                      className="form-select"
                      value={form.roomNumber}
                      onChange={e => handleRoomChange(e.target.value)}
                    >
                      <option value="">{t('noRoom')}</option>
                      {floorGroups.map(floor => (
                        <optgroup key={floor} label={`${t('floor')} ${floor}`}>
                          {rooms.filter(r => r.floor === floor).map(r => (
                            <option key={r._id} value={roomLabel(r)}>{roomLabel(r)}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('floor')}</label>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      value={form.floor}
                      onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) || 0 }))}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('phone')}</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 8900" />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('notes')}</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('notesClientPlaceholder')} style={{ minHeight: 72 }} />
                </div>
              </div>

              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null}
                  {saving ? t('saving') : editClient ? t('save') : t('addClient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
