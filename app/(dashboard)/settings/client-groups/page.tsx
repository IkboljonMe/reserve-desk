'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/lib/i18n'
import { Plus, Pencil, Trash2, Check, X, Users } from 'lucide-react'

interface ClientGroup {
  _id: string
  name: string
  color: string
  order: number
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#f97316', '#84cc16',
  '#64748b', '#a16207',
]

const EMPTY_FORM = { name: '', color: PRESET_COLORS[0] }

export default function ClientGroupsPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [groups, setGroups] = useState<ClientGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<ClientGroup | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client-groups')
      const data = await res.json()
      setGroups(Array.isArray(data) ? data : [])
    } catch {
      showToast(t('loadGroupsFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  useEffect(() => { loadData() }, [loadData])

  function openAdd() {
    setEditGroup(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(g: ClientGroup) {
    setEditGroup(g)
    setForm({ name: g.name, color: g.color })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditGroup(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editGroup ? `/api/client-groups/${editGroup._id}` : '/api/client-groups'
      const method = editGroup ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || t('failed'))
      }
      showToast(editGroup ? t('groupUpdated') : t('groupAdded'), 'success')
      closeModal()
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('saveGroupFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/client-groups/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t('groupDeleted'), 'success')
      setDeleteConfirm(null)
      loadData()
    } else {
      showToast(t('deleteFailed'), 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('clientGroups')}</h2>
          <p style={{ marginTop: 2, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            {t('clientGroupsSubtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          {t('addGroup')}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={24} strokeWidth={1.75} />
            </div>
            <h3>{t('noGroupsTitle')}</h3>
            <p>{t('noGroupsDesc')}</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>{t('addFirstGroup')}</button>
          </div>
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
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(g)} title={t('edit')} aria-label={t('editGroupAria')}>
                    <Pencil size={14} />
                  </button>
                  {deleteConfirm === g._id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}>{t('delete')}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteConfirm(g._id)} title={t('delete')} aria-label={t('deleteGroupAria')}>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>{editGroup ? t('editGroup') : t('addGroup')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label={t('close')}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('groupName')} *</label>
                  <input className="form-input" required autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('groupNamePlaceholder')} />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('color')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        aria-label={t('selectColor', { color: c })}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: c, cursor: 'pointer',
                          border: form.color === c ? '2px solid var(--gray-800)' : '2px solid transparent',
                          outline: form.color === c ? '2px solid #fff' : 'none',
                          outlineOffset: -4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {form.color === c && <Check size={14} color="#fff" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : null}
                  {saving ? t('saving') : editGroup ? t('save') : t('addGroup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
