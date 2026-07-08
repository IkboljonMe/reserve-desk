'use client'

import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useDraft } from '@/components/DraftProvider'
import { useTranslation } from '@/i18n'
import { Hotel, ClientGroup, Service, PricingPlan, PricingGroup } from './types'
import {
  extractHotelId, DRAFT_KEY, EMPTY_FORM, durationError, bufferError,
} from './utils'

export function useServicesPage() {
  const { showToast } = useToast()
  const { getDraft, saveDraft, clearDraft } = useDraft()
  const { t } = useTranslation()

  const [services, setServices] = useState<Service[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])
  const [loading, setLoading] = useState(true)

  // Add-plan mini flow: null = idle, 'choose' = pick room/client, then the
  // chosen target while a category is selected.
  const [planPicker, setPlanPicker] = useState<null | 'choose' | 'room' | 'client'>(null)
  const [pickerCategory, setPickerCategory] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set())

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterHotel, setFilterHotel] = useState('') // '' = all
  const [filterStatus, setFilterStatus] = useState('') // '' | 'active' | 'inactive'

  // Form / modal
  const [showForm, setShowForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [res, hRes, gRes] = await Promise.all([
      fetch('/api/services'), fetch('/api/hotels'), fetch('/api/client-groups'),
    ])
    const data = await res.json()
    const hData = await hRes.json()
    const gData = await gRes.json()
    setServices(Array.isArray(data) ? data : [])
    setHotels(Array.isArray(hData) ? hData : [])
    setClientGroups(Array.isArray(gData) ? gData : [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [])

  // Draft auto-save for new service form
  useEffect(() => {
    if (showForm && !editService) saveDraft(DRAFT_KEY, form)
  }, [form, showForm, editService, saveDraft])

  // Derived: hotel lookup map
  const hotelMap = useMemo(() => {
    const m = new Map<string, Hotel>()
    hotels.forEach(h => m.set(h._id, h))
    return m
  }, [hotels])

  const clientGroupMap = useMemo(() => {
    const m = new Map<string, ClientGroup>()
    clientGroups.forEach(g => m.set(g._id, g))
    return m
  }, [clientGroups])

  // Resolve a pricing group's display label + color.
  const resolveGroupMeta = useMemo(() => (pg: PricingGroup): { label: string; color: string } => {
    if (pg.target === 'client') {
      const g = clientGroupMap.get(pg.category)
      return { label: g?.name ?? t('unknownGroup'), color: g?.color ?? 'var(--gray-500)' }
    }
    return { label: pg.category, color: 'var(--brand-500)' }
  }, [clientGroupMap, t])

  // Filtered services
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return services.filter(svc => {
      const hid = extractHotelId(svc.hotelId)
      const belongsToFilterHotel = hid === filterHotel || (svc.sharedHotelIds ?? []).includes(filterHotel)
      if (q && !svc.name.toLowerCase().includes(q) && !svc.description?.toLowerCase().includes(q)) return false
      if (filterHotel && !belongsToFilterHotel) return false
      if (filterStatus === 'active' && !svc.isActive) return false
      if (filterStatus === 'inactive' && svc.isActive) return false
      return true
    })
  }, [services, searchQuery, filterHotel, filterStatus])

  const activeCount = services.filter(s => s.isActive).length

  // ── Form helpers ────────────────────────────────────────────────────────────

  function openAddForm() {
    setEditService(null)
    setPlanPicker(null)
    setPickerCategory('')
    setCollapsedGroups(new Set())
    const draft = getDraft<typeof EMPTY_FORM>(DRAFT_KEY)
    if (draft) {
      setForm({ ...EMPTY_FORM, ...draft })
      showToast(t('draftRestored'), 'info')
    } else {
      setForm({ ...EMPTY_FORM })
    }
    setShowForm(true)
  }

  function openEditForm(svc: Service) {
    setEditService(svc)
    setPlanPicker(null)
    setPickerCategory('')
    setCollapsedGroups(new Set())
    setForm({
      name: svc.name,
      icon: svc.icon || 'Waves',
      description: svc.description,
      hotelId: extractHotelId(svc.hotelId),
      sharedHotelIds: (svc.sharedHotelIds || []).map(h => (typeof h === 'string' ? h : (h as { _id: string })._id)),
      openTime: svc.openTime,
      closeTime: svc.closeTime,
      slotDuration: svc.slotDuration,
      capacity: svc.capacity,
      price: svc.price || 0,
      isFree: svc.isFree || false,
      details: svc.details || '',
      bufferTimeBefore: svc.bufferTimeBefore || 0,
      bufferTimeAfter: svc.bufferTimeAfter || 0,
      pricingPlans: svc.pricingPlans || [],
      pricingGroups: svc.pricingGroups || [],
      color: svc.color,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditService(null)
  }

  function discardDraft() {
    clearDraft(DRAFT_KEY)
    setForm({ ...EMPTY_FORM })
    showToast(t('draftCleared'), 'info')
  }

  function updatePricingPlan(index: number, key: keyof PricingPlan, value: string) {
    const plans = [...form.pricingPlans]
    plans[index][key] = value === '' ? '' : Number(value)
    setForm(f => ({ ...f, pricingPlans: plans }))
  }

  function removePricingPlan(index: number) {
    const plans = [...form.pricingPlans]
    plans.splice(index, 1)
    setForm(f => ({ ...f, pricingPlans: plans }))
  }

  // ── Category-scoped pricing groups ──────────────────────────────────────────

  function confirmAddGroup() {
    if (!planPicker || planPicker === 'choose' || !pickerCategory) return
    const target = planPicker
    // Don't create a duplicate for the same target+category; expand it instead.
    const existing = form.pricingGroups.findIndex(g => g.target === target && g.category === pickerCategory)
    if (existing !== -1) {
      setCollapsedGroups(prev => { const n = new Set(prev); n.delete(existing); return n })
      showToast(t('categoryHasGroup'), 'info')
    } else {
      setForm(f => ({
        ...f,
        pricingGroups: [...f.pricingGroups, { target, category: pickerCategory, rows: [{ duration: 60, price: 0 }] }],
      }))
    }
    setPlanPicker(null)
    setPickerCategory('')
  }

  function removePricingGroup(gi: number) {
    setForm(f => ({ ...f, pricingGroups: f.pricingGroups.filter((_, i) => i !== gi) }))
    setCollapsedGroups(prev => {
      const next = new Set<number>()
      prev.forEach(i => { if (i < gi) next.add(i); else if (i > gi) next.add(i - 1) })
      return next
    })
  }

  function toggleGroupCollapse(gi: number) {
    setCollapsedGroups(prev => {
      const n = new Set(prev)
      if (n.has(gi)) n.delete(gi); else n.add(gi)
      return n
    })
  }

  function addGroupRow(gi: number) {
    setForm(f => {
      const groups = f.pricingGroups.map((g, i) =>
        i === gi ? { ...g, rows: [...g.rows, { duration: 60, price: 0 }] } : g
      )
      return { ...f, pricingGroups: groups }
    })
  }

  function updateGroupRow(gi: number, ri: number, key: keyof PricingPlan, value: string) {
    setForm(f => {
      const groups = f.pricingGroups.map((g, i) => {
        if (i !== gi) return g
        const rows = g.rows.map((r, j) => j === ri ? { ...r, [key]: value === '' ? '' : Number(value) } : r)
        return { ...g, rows }
      })
      return { ...f, pricingGroups: groups }
    })
  }

  function removeGroupRow(gi: number, ri: number) {
    setForm(f => {
      const groups = f.pricingGroups.map((g, i) =>
        i === gi ? { ...g, rows: g.rows.filter((_, j) => j !== ri) } : g
      )
      return { ...f, pricingGroups: groups }
    })
  }

  // Available categories for the current picker, excluding ones already added.
  function pickerOptions(): { value: string; label: string }[] {
    if (planPicker === 'room') {
      // Include the owner hotel's room types plus every shared hotel's, so a
      // shared service can price each participating hotel's categories.
      const ids = [form.hotelId, ...form.sharedHotelIds]
      const types = [...new Set(ids.flatMap(id => hotelMap.get(id)?.roomTypes ?? []))]
      return types
        .filter(rt => !form.pricingGroups.some(g => g.target === 'room' && g.category === rt))
        .map(rt => ({ value: rt, label: rt }))
    }
    if (planPicker === 'client') {
      return clientGroups
        .filter(g => !form.pricingGroups.some(pg => pg.target === 'client' && pg.category === g._id))
        .map(g => ({ value: g._id, label: g.name }))
    }
    return []
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.hotelId) { showToast(t('selectHotelError'), 'error'); return }
    if (!form.isFree && form.pricingPlans.length > 0) {
      if (form.pricingPlans.some(p => p.duration === '' || durationError(p.duration))) {
        showToast(t('planDurationError'), 'error'); return
      }
    }
    if (!form.isFree && form.pricingGroups.length > 0) {
      const emptyGroup = form.pricingGroups.find(g => g.rows.length === 0)
      if (emptyGroup) {
        const meta = resolveGroupMeta(emptyGroup)
        showToast(t('addPriceRowError', { label: meta.label }), 'error'); return
      }
      if (form.pricingGroups.some(g => g.rows.some(r => r.duration === '' || durationError(r.duration)))) {
        showToast(t('categoryDurationError'), 'error'); return
      }
    }
    if (bufferError(form.bufferTimeBefore) || bufferError(form.bufferTimeAfter)) {
      showToast(t('bufferTimesError'), 'error'); return
    }
    setSaving(true)
    try {
      const url = editService ? `/api/services/${editService._id}` : '/api/services'
      const method = editService ? 'PUT' : 'POST'
      const payload = {
        ...form,
        pricingPlans: form.pricingPlans.map(p => ({ duration: Number(p.duration) || 0, price: Number(p.price) || 0 })),
        pricingGroups: form.pricingGroups.map(g => ({
          target: g.target,
          category: g.category,
          rows: g.rows.map(r => ({ duration: Number(r.duration) || 0, price: Number(r.price) || 0 })),
        })),
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        showToast(editService ? t('serviceUpdated') : t('serviceCreated'), 'success')
        if (!editService) clearDraft(DRAFT_KEY)
        closeForm(); load()
      } else {
        const d = await res.json()
        showToast(d.error || t('saveFailed'), 'error')
      }
    } finally { setSaving(false) }
  }

  async function toggleActive(svc: Service) {
    const res = await fetch(`/api/services/${svc._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !svc.isActive }),
    })
    if (res.ok) { showToast(svc.isActive ? t('serviceDeactivated') : t('serviceActivated'), 'info'); load() }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast(t('serviceDeleted'), 'success'); setDeleteConfirm(null); load() }
    else showToast(t('deleteFailed'), 'error')
  }

  const hasActiveFilters = searchQuery || filterHotel || filterStatus

  return {
    services, hotels, clientGroups, loading,
    planPicker, setPlanPicker, pickerCategory, setPickerCategory, collapsedGroups,
    searchQuery, setSearchQuery, filterHotel, setFilterHotel, filterStatus, setFilterStatus,
    showForm, editService, form, setForm, saving, deleteConfirm, setDeleteConfirm,
    hotelMap, resolveGroupMeta, filtered, activeCount, hasActiveFilters,
    openAddForm, openEditForm, closeForm, discardDraft,
    updatePricingPlan, removePricingPlan, confirmAddGroup, removePricingGroup,
    toggleGroupCollapse, addGroupRow, updateGroupRow, removeGroupRow, pickerOptions,
    handleSubmit, toggleActive, handleDelete,
  }
}

export type ServicesPageState = ReturnType<typeof useServicesPage>
