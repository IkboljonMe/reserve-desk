'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'

interface Hotel {
  _id: string
  name: string
}

export default function HotelsPage() {
  const { showToast } = useToast()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function loadHotels() {
    setLoading(true)
    const res = await fetch('/api/hotels')
    const data = await res.json()
    setHotels(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadHotels() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        showToast('Hotel added', 'success')
        setAddOpen(false)
        setName('')
        loadHotels()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to add hotel', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/hotels/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Hotel deleted', 'success')
      setDeleteConfirm(null)
      loadHotels()
    } else {
      showToast('Failed to delete hotel', 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Hotel
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
        </div>
      ) : hotels.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3>No hotels added yet</h3>
            <p>Add hotels to group your services.</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setAddOpen(true)}>Add First Hotel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {hotels.map(hotel => (
                <div
                  key={hotel._id}
                  style={{
                    background: '#fff',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--gray-100)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '1rem' }}>
                    🏢 {hotel.name}
                  </div>
                  {deleteConfirm === hotel._id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-danger btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => handleDelete(hotel._id)}>✓</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px' }} onClick={() => setDeleteConfirm(null)}>✗</button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(hotel._id)} title="Delete hotel">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Hotel Modal */}
      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Hotel</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setAddOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Hotel Name *</label>
                <input
                  className="form-input"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Grand Plaza"
                />
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null}
                  {saving ? 'Adding…' : 'Add Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
