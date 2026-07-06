'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'

interface Room {
  _id: string
  number: string
  floor: number
  description: string
}

export default function RoomsPage() {
  const { showToast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ number: '', floor: 1, description: '' })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rooms')
      const data = await res.json()
      setRooms(Array.isArray(data) ? data : [])
    } catch {
      showToast('Failed to load rooms', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadRooms() }, [loadRooms])

  // Group rooms by floor
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.number.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to add room', 'error')
      } else {
        showToast('Room added', 'success')
        setAddOpen(false)
        setForm({ number: '', floor: 1, description: '' })
        loadRooms()
      }
    } catch {
      showToast('Failed to add room', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Room deleted', 'success')
      setDeleteConfirm(null)
      loadRooms()
    } else {
      showToast('Failed to delete room', 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Room
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3>No rooms added yet</h3>
            <p>Add hotel rooms to use room number selection during booking.</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setAddOpen(true)}>Add First Room</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {floors.map(floor => (
            <div key={floor} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '0.75rem 1.25rem',
                background: 'var(--gray-50)',
                borderBottom: '1px solid var(--gray-200)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--gray-600)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                Floor {floor}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, background: 'var(--gray-200)' }}>
                {rooms.filter(r => r.floor === floor).map(room => (
                  <div
                    key={room._id}
                    style={{
                      background: '#fff',
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '1rem' }}>
                        🏨 {room.number}
                      </div>
                      {room.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>{room.description}</div>
                      )}
                    </div>
                    {deleteConfirm === room._id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handleDelete(room._id)}>✓</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px' }} onClick={() => setDeleteConfirm(null)}>✗</button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(room._id)} title="Delete room">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Room</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setAddOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Floor *</label>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      required
                      value={form.floor}
                      onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) || 1 }))}
                      placeholder="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Number *</label>
                    <input
                      className="form-input"
                      required
                      value={form.number}
                      onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                      placeholder="101"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <input
                    className="form-input"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Deluxe suite, sea view…"
                  />
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null}
                  {saving ? 'Adding…' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
