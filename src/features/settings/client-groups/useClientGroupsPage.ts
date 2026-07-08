'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'

export interface ClientGroup {
  _id: string
  name: string
  color: string
  order: number
}

export const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#f97316', '#84cc16',
  '#64748b', '#a16207',
]

export const EMPTY_FORM = { name: '', color: PRESET_COLORS[0] }

export function useClientGroupsPage() {
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return {
    groups, loading, modalOpen, editGroup, form, setForm, saving,
    deleteConfirm, setDeleteConfirm, openAdd, openEdit, closeModal, handleSave, handleDelete,
  }
}

export type ClientGroupsPageState = ReturnType<typeof useClientGroupsPage>
