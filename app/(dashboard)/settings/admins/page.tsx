'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/lib/i18n'
import { Plus, Pencil, Trash2, X, ShieldCheck } from 'lucide-react'
import { getAdmins, saveAdmin, deleteAdmin, type AdminRecord } from '@/lib/api/admins'
import { getHotels } from '@/lib/api/hotels'

interface Hotel {
  _id: string
  name: string
  shortName: string
}

const EMPTY_FORM = { name: '', email: '', password: '', hotelId: '' }

export default function AdminsPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [admins, setAdmins] = useState<AdminRecord[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState<AdminRecord | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [adminList, hotelList] = await Promise.all([getAdmins(), getHotels()])
      setAdmins(Array.isArray(adminList) ? adminList : [])
      setHotels(Array.isArray(hotelList) ? hotelList : [])
    } catch {
      showToast(t('loadAdminsFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  useEffect(() => { loadData() }, [loadData])

  function openAdd() {
    setEditAdmin(null)
    setForm({ ...EMPTY_FORM, hotelId: hotels[0]?._id || '' })
    setModalOpen(true)
  }

  function openEdit(a: AdminRecord) {
    setEditAdmin(a)
    setForm({ name: a.name, email: a.email, password: '', hotelId: a.hotelId?._id || '' })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditAdmin(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.hotelId) return
    setSaving(true)
    try {
      const payload: { name: string; email: string; hotelId: string; password?: string } = {
        name: form.name.trim(),
        email: form.email.trim(),
        hotelId: form.hotelId,
      }
      // On create the password is required; on edit an empty field keeps the old one.
      if (form.password) payload.password = form.password
      await saveAdmin(payload, editAdmin?._id)
      showToast(editAdmin ? t('adminUpdated') : t('adminAdded'), 'success')
      closeModal()
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('saveAdminFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAdmin(id)
      showToast(t('adminDeleted'), 'success')
      setDeleteConfirm(null)
      loadData()
    } catch {
      showToast(t('deleteFailed'), 'error')
    }
  }

  const noHotels = hotels.length === 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('admins')}</h2>
          <p style={{ marginTop: 2, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            {t('adminsSubtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} disabled={noHotels} title={noHotels ? t('addHotelFirst') : undefined}>
          <Plus size={14} strokeWidth={2.5} />
          {t('addAdmin')}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
          </div>
        ) : admins.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ShieldCheck size={24} strokeWidth={1.75} />
            </div>
            <h3>{t('noAdminsTitle')}</h3>
            <p>{noHotels ? t('addHotelFirst') : t('noAdminsDesc')}</p>
            {!noHotels && (
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstAdmin')}</button>
            )}
          </div>
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
                <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', flexShrink: 0 }}>
                  {a.hotelId ? `${a.hotelId.name} (${a.hotelId.shortName})` : t('noHotelAssigned')}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(a)} title={t('edit')} aria-label={t('editAdminAria')}>
                    <Pencil size={14} />
                  </button>
                  {deleteConfirm === a._id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}>{t('delete')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(a._id)} title={t('delete')} aria-label={t('deleteAdminAria')}>
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>{editAdmin ? t('editAdmin') : t('addAdmin')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label={t('close')}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('fullName')} *</label>
                  <input className="form-input" required autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('email')} *</label>
                  <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('password')} {editAdmin ? '' : '*'}</label>
                  <input
                    className="form-input"
                    type="password"
                    required={!editAdmin}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  {editAdmin && (
                    <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--gray-500)' }}>{t('passwordKeepHint')}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('hotel')} *</label>
                  <select className="form-input" required value={form.hotelId} onChange={e => setForm(f => ({ ...f, hotelId: e.target.value }))}>
                    <option value="" disabled>{t('selectHotel')}</option>
                    {hotels.map(h => (
                      <option key={h._id} value={h._id}>{h.name} ({h.shortName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null}
                  {saving ? t('saving') : editAdmin ? t('save') : t('addAdmin')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
