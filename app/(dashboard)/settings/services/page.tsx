'use client'

import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useDraft } from '@/components/DraftProvider'
import { useTranslation } from '@/lib/i18n'
import { ServiceIcon } from '@/lib/serviceIcons'
import IconPicker from '@/components/IconPicker'
import Select from '@/components/Select'
import {
  Building2, Search, Filter, Clock, Users, Plus, Pencil, Trash2,
  Check, X, Zap, ChevronRight, ChevronDown, BedDouble, ToggleLeft, ToggleRight,
} from 'lucide-react'

type TranslateFn = ReturnType<typeof useTranslation>['t']

interface Hotel {
  _id: string
  name: string
  shortName: string
  roomTypes?: string[]
}

interface ClientGroup {
  _id: string
  name: string
  color: string
}

interface PricingPlan {
  duration: number | string
  price: number | string
}

interface PricingGroup {
  target: 'room' | 'client'
  category: string
  rows: PricingPlan[]
}

interface Service {
  _id: string
  name: string
  icon: string
  description: string
  hotelId: string | { _id: string; name: string; shortName?: string }
  openTime: string
  closeTime: string
  slotDuration: number
  capacity: number
  price?: number
  isFree?: boolean
  details?: string
  bufferTimeBefore?: number
  bufferTimeAfter?: number
  pricingPlans?: PricingPlan[]
  pricingGroups?: PricingGroup[]
  color: string
  isActive: boolean
}

// Safely extract a plain-string hotel ID regardless of whether hotelId was
// populated (object) or left as a raw ObjectId string.
function extractHotelId(hotelId: Service['hotelId']): string {
  if (!hotelId) return ''
  if (typeof hotelId === 'string') return hotelId
  return hotelId._id ?? ''
}

const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b',
  '#10b981','#06b6d4','#3b82f6','#f97316','#84cc16',
  '#64748b','#a16207',
]

const DRAFT_KEY = 'add-service'

const EMPTY_FORM = {
  name: '', description: '', hotelId: '', icon: 'Waves',
  openTime: '08:00', closeTime: '20:00',
  slotDuration: 60, capacity: 1, color: '#6366f1',
  price: 0, isFree: false, details: '',
  bufferTimeBefore: 0, bufferTimeAfter: 0,
  pricingPlans: [] as PricingPlan[],
  pricingGroups: [] as PricingGroup[],
}

const DURATION_STEP = 15

function durationError(v: number | string): boolean {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  return !Number.isInteger(n) || n <= 0 || n % DURATION_STEP !== 0
}

function bufferError(v: number | string): boolean {
  if (v === '' || v === null || v === undefined) return false
  const n = Number(v)
  return !Number.isInteger(n) || n < 0 || n % DURATION_STEP !== 0
}

function selectAllOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.select()
}

function formatPrice(v: number | string): string {
  const digits = String(v ?? '').replace(/\D/g, '')
  if (digits === '') return ''
  return String(Number(digits)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// ── Service Card ──────────────────────────────────────────────────────────────

function ServiceCard({
  svc,
  hotelName,
  onEdit,
  onToggleActive,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  deleteConfirm,
  groupMeta,
  t,
}: {
  svc: Service
  hotelName: string | undefined
  onEdit: () => void
  onToggleActive: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  deleteConfirm: boolean
  groupMeta: (g: PricingGroup) => { label: string; color: string }
  t: TranslateFn
}) {
  const hasPlans = svc.pricingPlans && svc.pricingPlans.length > 0
  const hasGroups = svc.pricingGroups && svc.pricingGroups.length > 0
  const hasBuffer = (svc.bufferTimeBefore ?? 0) > 0 || (svc.bufferTimeAfter ?? 0) > 0

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `3px solid ${svc.color}`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-md)'
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = svc.color
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-sm)'
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'var(--surface-border)'
        el.style.borderTopColor = svc.color
      }}
    >
      {/* Card Header */}
      <div style={{ padding: '1.125rem 1.25rem 0.875rem', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${svc.color}18`,
          border: `1.5px solid ${svc.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: svc.color,
        }}>
          <ServiceIcon name={svc.icon} serviceName={svc.name} size={22} strokeWidth={1.75} />
        </div>

        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontWeight: 700, fontSize: '0.9375rem',
              color: 'var(--gray-800)', letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {svc.name}
            </span>
            {/* Status dot */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 20,
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.02em',
              background: svc.isActive ? '#ecfdf5' : 'var(--gray-100)',
              color: svc.isActive ? '#047857' : 'var(--gray-500)',
              border: `1px solid ${svc.isActive ? '#a7f3d0' : 'var(--gray-200)'}`,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: svc.isActive ? '#10b981' : 'var(--gray-400)',
                flexShrink: 0,
              }} />
              {svc.isActive ? t('active') : t('inactive')}
            </span>
          </div>

          {/* Hotel tag */}
          {hotelName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--gray-400)' }}>
              <Building2 size={11} />
              <span>{hotelName}</span>
            </div>
          )}
        </div>

        {/* Quick toggle */}
        <button
          onClick={onToggleActive}
          title={svc.isActive ? 'Deactivate' : 'Activate'}
          aria-label={svc.isActive ? 'Deactivate service' : 'Activate service'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: svc.isActive ? '#10b981' : 'var(--gray-300)',
            transition: 'color 0.15s ease',
            flexShrink: 0,
          }}
        >
          {svc.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
      </div>

      {/* Description */}
      {svc.description && (
        <div style={{ padding: '0 1.25rem 0.75rem', fontSize: '0.775rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>
          {svc.description}
        </div>
      )}

      {/* Pricing chips */}
      {hasPlans && (
        <div style={{ padding: '0 1.25rem 0.875rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {svc.pricingPlans!.map((plan, i) => (
            <span key={i} style={{
              background: `${svc.color}12`, color: svc.color,
              border: `1px solid ${svc.color}30`,
              padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
            }}>
              {plan.duration}m · {Number(plan.price).toLocaleString()} uzs
            </span>
          ))}
        </div>
      )}
      {svc.isFree && !hasPlans && (
        <div style={{ padding: '0 1.25rem 0.875rem' }}>
          <span className="badge badge-blue">Free Service</span>
        </div>
      )}

      {/* Category pricing summary */}
      {hasGroups && (
        <div style={{ padding: '0 1.25rem 0.875rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {svc.pricingGroups!.map((g, i) => {
            const meta = groupMeta(g)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.68rem', fontWeight: 700, color: meta.color,
                }}>
                  {g.target === 'room' ? <BedDouble size={11} /> : <Users size={11} />}
                  {meta.label}
                </span>
                {g.rows.map((r, j) => (
                  <span key={j} style={{
                    background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30`,
                    padding: '2px 7px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600,
                  }}>
                    {r.duration}m · {Number(r.price).toLocaleString()}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer meta */}
      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--surface-border)',
        padding: '0.625rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--gray-50)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--gray-400)' }}>
          <Clock size={11} />
          {svc.openTime}–{svc.closeTime}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--gray-400)' }}>
          <Users size={11} />
          {svc.capacity}
        </span>
        {hasBuffer && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--warning)' }}>
            <Zap size={10} />
            {svc.bufferTimeBefore || 0}+{svc.bufferTimeAfter || 0}m
          </span>
        )}

        {/* Action buttons pushed right */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {deleteConfirm ? (
            <>
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={onDeleteConfirm}
                aria-label="Confirm delete"
              >
                <Check size={13} />
              </button>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={onDeleteCancel}
                aria-label="Cancel delete"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={onEdit}
                title={t('edit')}
                aria-label={`Edit ${svc.name}`}
              >
                <Pencil size={14} />
              </button>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={onDeleteRequest}
                title={t('delete')}
                aria-label={`Delete ${svc.name}`}
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ServicesPage() {
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
      return { label: g?.name ?? 'Unknown group', color: g?.color ?? 'var(--gray-500)' }
    }
    return { label: pg.category, color: 'var(--brand-500)' }
  }, [clientGroupMap])

  // Filtered services
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return services.filter(svc => {
      const hid = extractHotelId(svc.hotelId)
      if (q && !svc.name.toLowerCase().includes(q) && !svc.description?.toLowerCase().includes(q)) return false
      if (filterHotel && hid !== filterHotel) return false
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
      showToast('Restored your unsaved draft', 'info')
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
    showToast('Draft cleared', 'info')
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
      showToast('That category already has a pricing group', 'info')
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
      const hotel = hotelMap.get(form.hotelId)
      const types = hotel?.roomTypes ?? []
      return types
        .filter(t => !form.pricingGroups.some(g => g.target === 'room' && g.category === t))
        .map(t => ({ value: t, label: t }))
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
    if (!form.hotelId) { showToast('Please select a hotel', 'error'); return }
    if (!form.isFree && form.pricingPlans.length > 0) {
      if (form.pricingPlans.some(p => p.duration === '' || durationError(p.duration))) {
        showToast('Each plan duration must be a multiple of 15 minutes', 'error'); return
      }
    }
    if (!form.isFree && form.pricingGroups.length > 0) {
      const emptyGroup = form.pricingGroups.find(g => g.rows.length === 0)
      if (emptyGroup) {
        const meta = resolveGroupMeta(emptyGroup)
        showToast(`Add at least one price row to "${meta.label}" or remove it`, 'error'); return
      }
      if (form.pricingGroups.some(g => g.rows.some(r => r.duration === '' || durationError(r.duration)))) {
        showToast('Each category price duration must be a multiple of 15 minutes', 'error'); return
      }
    }
    if (bufferError(form.bufferTimeBefore) || bufferError(form.bufferTimeAfter)) {
      showToast('Buffer times must be a multiple of 15 minutes (e.g. 0, 15, 30)', 'error'); return
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
        showToast(editService ? 'Service updated!' : 'Service created!', 'success')
        if (!editService) clearDraft(DRAFT_KEY)
        closeForm(); load()
      } else {
        const d = await res.json()
        showToast(d.error || 'Failed to save', 'error')
      }
    } finally { setSaving(false) }
  }

  async function toggleActive(svc: Service) {
    const res = await fetch(`/api/services/${svc._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !svc.isActive }),
    })
    if (res.ok) { showToast(svc.isActive ? 'Service deactivated' : 'Service activated', 'info'); load() }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
    if (res.ok) { showToast('Service deleted', 'success'); setDeleteConfirm(null); load() }
    else showToast('Failed to delete', 'error')
  }

  const hasActiveFilters = searchQuery || filterHotel || filterStatus

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <style>{`
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .hide-arrows[type=number] { -moz-appearance: textfield; }
        .price-input { font-variant-numeric: tabular-nums; letter-spacing: 2px; font-weight: 500; }
        .price-input::placeholder { letter-spacing: normal; font-weight: 400; }
        .svc-filter-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
          cursor: pointer; border: 1.5px solid var(--gray-200); background: var(--surface-card);
          color: var(--gray-600); transition: all 0.15s ease; white-space: nowrap;
          font-family: inherit;
        }
        .svc-filter-pill:hover { border-color: var(--brand-500); color: var(--brand-700); background: var(--brand-50); }
        .svc-filter-pill.active { background: var(--brand-gradient); color: #fff; border-color: transparent; box-shadow: var(--shadow-brand); }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('services')}
            {!loading && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '1px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)',
                marginLeft: 4,
              }}>
                {activeCount} active
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: 2 }}>
            Manage bookable services and their availability across your hotels.
          </p>
        </div>
        <button id="add-service-btn" className="btn btn-primary" onClick={openAddForm}>
          <Plus size={15} strokeWidth={2.5} />
          {t('addService')}
        </button>
      </div>

      {/* ── Filter Bar ── */}
      {!loading && services.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-xs)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: '0.8125rem' }}
              placeholder="Search services…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search services"
            />
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--gray-200)', flexShrink: 0 }} />

          {/* Hotel filter pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>
              <Filter size={12} /> Hotel
            </span>
            <button
              className={`svc-filter-pill ${filterHotel === '' ? 'active' : ''}`}
              onClick={() => setFilterHotel('')}
            >
              All
            </button>
            {hotels.map(h => (
              <button
                key={h._id}
                className={`svc-filter-pill ${filterHotel === h._id ? 'active' : ''}`}
                onClick={() => setFilterHotel(filterHotel === h._id ? '' : h._id)}
              >
                {h.shortName || h.name}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--gray-200)', flexShrink: 0 }} />

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>Status</span>
            {(['', 'active', 'inactive'] as const).map(val => (
              <button
                key={val || 'all'}
                className={`svc-filter-pill ${filterStatus === val ? 'active' : ''}`}
                onClick={() => setFilterStatus(val)}
              >
                {val === '' ? 'All' : val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearchQuery(''); setFilterHotel(''); setFilterStatus('') }}
              style={{ marginLeft: 'auto', color: 'var(--gray-400)', fontSize: '0.75rem' }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
        </div>
      ) : services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3>No {t('services').toLowerCase()} yet</h3>
            <p>Add your first service to start taking bookings.</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openAddForm}>
              <Plus size={15} /> {t('addService')}
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={26} />
            </div>
            <h3>No results</h3>
            <p>No services match your current filters.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => { setSearchQuery(''); setFilterHotel(''); setFilterStatus('') }}>
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Group by hotel when filtering all hotels */}
          {filterHotel ? (
            <div className="services-grid">
              {filtered.map(svc => (
                <ServiceCard
                  key={svc._id}
                  svc={svc}
                  hotelName={hotelMap.get(extractHotelId(svc.hotelId))?.name}
                  onEdit={() => openEditForm(svc)}
                  onToggleActive={() => toggleActive(svc)}
                  onDeleteRequest={() => setDeleteConfirm(svc._id)}
                  onDeleteConfirm={() => handleDelete(svc._id)}
                  onDeleteCancel={() => setDeleteConfirm(null)}
                  deleteConfirm={deleteConfirm === svc._id}
                  groupMeta={resolveGroupMeta}
                  t={t}
                />
              ))}
            </div>
          ) : (
            // Group by hotel
            hotels
              .filter(h => filtered.some(s => extractHotelId(s.hotelId) === h._id))
              .map(hotel => {
                const hotelServices = filtered.filter(s => extractHotelId(s.hotelId) === hotel._id)
                const unassigned = filtered.filter(s => { const hid = extractHotelId(s.hotelId); return !hid || !hotelMap.has(hid) })
                return (
                  <div key={hotel._id} style={{ marginBottom: '2rem' }}>
                    {/* Hotel group header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 38, height: 28, padding: '0 8px', borderRadius: 8,
                        background: 'var(--brand-500)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em',
                      }}>
                        {hotel.shortName || hotel.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gray-700)' }}>
                        {hotel.name}
                      </span>
                      <ChevronRight size={14} style={{ color: 'var(--gray-300)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }} className="tabular-nums">
                        {hotelServices.length} {hotelServices.length === 1 ? 'service' : 'services'}
                      </span>
                    </div>
                    <div className="services-grid">
                      {hotelServices.map(svc => (
                        <ServiceCard
                          key={svc._id}
                          svc={svc}
                          hotelName={undefined}
                          onEdit={() => openEditForm(svc)}
                          onToggleActive={() => toggleActive(svc)}
                          onDeleteRequest={() => setDeleteConfirm(svc._id)}
                          onDeleteConfirm={() => handleDelete(svc._id)}
                          onDeleteCancel={() => setDeleteConfirm(null)}
                          deleteConfirm={deleteConfirm === svc._id}
                          groupMeta={resolveGroupMeta}
                          t={t}
                        />
                      ))}
                    </div>
                    {/* Show unassigned only once, after last hotel group */}
                    {hotel._id === hotels[hotels.length - 1]._id && unassigned.length > 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--warning)' }}>Unassigned</span>
                        </div>
                        <div className="services-grid">
                          {unassigned.map(svc => (
                            <ServiceCard
                              key={svc._id}
                              svc={svc}
                              hotelName={undefined}
                              onEdit={() => openEditForm(svc)}
                              onToggleActive={() => toggleActive(svc)}
                              onDeleteRequest={() => setDeleteConfirm(svc._id)}
                              onDeleteConfirm={() => handleDelete(svc._id)}
                              onDeleteCancel={() => setDeleteConfirm(null)}
                              deleteConfirm={deleteConfirm === svc._id}
                              groupMeta={resolveGroupMeta}
                              t={t}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
          )}
        </>
      )}

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Preview icon in title */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: 10,
                  background: `${form.color}18`, border: `1.5px solid ${form.color}40`,
                  color: form.color, flexShrink: 0,
                }}>
                  <ServiceIcon name={form.icon} size={18} />
                </span>
                <h2 style={{ margin: 0 }}>{editService ? `Edit: ${editService.name}` : t('addService')}</h2>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={closeForm} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text" className="form-input"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Icon *</label>
                    <IconPicker value={form.icon} onChange={name => setForm(f => ({ ...f, icon: name }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Hotel *</label>
                  <Select
                    ariaLabel="Select hotel"
                    placeholder="Select hotel…"
                    icon={<Building2 size={16} />}
                    value={form.hotelId}
                    onChange={v => setForm(f => ({ ...f, hotelId: v }))}
                    options={hotels.map(h => ({ value: h._id, label: h.name }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea" style={{ minHeight: 60 }}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('details')}</label>
                  <input type="text" className="form-input" placeholder="e.g. Toyota Hiace, 45 capacity…" value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} />
                </div>

                <div className="divider" style={{ margin: '0.1rem 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Opens at *</label>
                    <input type="time" className="form-input" value={form.openTime} onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Closes at *</label>
                    <input type="time" className="form-input" value={form.closeTime} onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">⏪ Buffer Before (min)</label>
                    <input
                      type="number" className="form-input hide-arrows"
                      min={0} max={120} step={15} placeholder="e.g. 15"
                      value={form.bufferTimeBefore} onFocus={selectAllOnFocus}
                      onChange={e => setForm(f => ({ ...f, bufferTimeBefore: Number(e.target.value) }))}
                      aria-invalid={bufferError(form.bufferTimeBefore)}
                      style={bufferError(form.bufferTimeBefore) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                    />
                    {bufferError(form.bufferTimeBefore)
                      ? <small className="form-error" style={{ display: 'block', marginTop: 4 }}>Must be 0, 15, 30, 45…</small>
                      : <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>15 min intervals</small>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">⏩ Buffer After (min)</label>
                    <input
                      type="number" className="form-input hide-arrows"
                      min={0} max={120} step={15} placeholder="e.g. 15"
                      value={form.bufferTimeAfter} onFocus={selectAllOnFocus}
                      onChange={e => setForm(f => ({ ...f, bufferTimeAfter: Number(e.target.value) }))}
                      aria-invalid={bufferError(form.bufferTimeAfter)}
                      style={bufferError(form.bufferTimeAfter) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                    />
                    {bufferError(form.bufferTimeAfter)
                      ? <small className="form-error" style={{ display: 'block', marginTop: 4 }}>Must be 0, 15, 30, 45…</small>
                      : <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>15 min intervals</small>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Calendar Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c} type="button"
                        className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        title={c} aria-label={`Calendar color ${c}`} aria-pressed={form.color === c}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Pricing (moved to bottom; grows as categories are added) ── */}
                <div style={{ border: '1px solid var(--brand-100)', borderRadius: 10, padding: 16, background: '#fcfdff' }}>
                  <div style={{ marginBottom: '0.875rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--brand-700)', margin: 0 }}>{t('pricingPlans')}</h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray-500)', margin: '2px 0 0' }}>
                      Set prices per room category or client group. Add a plan and pick who it applies to.
                    </p>
                  </div>

                  {/* Legacy flat plans (kept editable when a service already has them) */}
                  {form.pricingPlans.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--gray-200)' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray-500)' }}>General plans</span>
                      {form.pricingPlans.map((plan, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ marginBottom: 4 }}>{t('durationMin')}</label>
                            <input
                              type="number" className="form-input hide-arrows" value={plan.duration}
                              onChange={e => updatePricingPlan(index, 'duration', e.target.value)}
                              onFocus={selectAllOnFocus} min={15} step={15} required
                              aria-invalid={durationError(plan.duration)}
                              style={durationError(plan.duration) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ marginBottom: 4 }}>{t('price')} (UZS)</label>
                            <input
                              type="text" inputMode="numeric" className="form-input price-input"
                              value={formatPrice(plan.price)}
                              onChange={e => {
                                const digits = e.target.value.replace(/\D/g, '')
                                updatePricingPlan(index, 'price', digits === '' ? '' : String(Number(digits)))
                              }}
                              onFocus={e => { if (Number(plan.price) === 0) updatePricingPlan(index, 'price', ''); else e.currentTarget.select() }}
                              onBlur={() => { if (plan.price === '') updatePricingPlan(index, 'price', '0') }}
                              placeholder="0" required
                            />
                          </div>
                          <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ marginTop: 22, color: 'var(--danger)' }} onClick={() => removePricingPlan(index)} aria-label={`Remove plan ${index + 1}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category-scoped pricing group cards */}
                  {form.pricingGroups.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                      {form.pricingGroups.map((group, gi) => {
                        const meta = resolveGroupMeta(group)
                        const collapsed = collapsedGroups.has(gi)
                        return (
                          <div key={gi} style={{ border: `1px solid ${meta.color}40`, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                            {/* Card header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: `${meta.color}10`, cursor: 'pointer' }} onClick={() => toggleGroupCollapse(gi)}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: meta.color, fontWeight: 700, fontSize: '0.8rem' }}>
                                {group.target === 'room' ? <BedDouble size={14} /> : <Users size={14} />}
                                {meta.label}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {group.target === 'room' ? 'Room' : 'Client'}
                              </span>
                              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                                {group.rows.length} {group.rows.length === 1 ? 'price' : 'prices'}
                              </span>
                              <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={e => { e.stopPropagation(); removePricingGroup(gi) }} aria-label={`Remove ${meta.label} pricing`}>
                                <Trash2 size={13} />
                              </button>
                              <ChevronDown size={15} style={{ color: 'var(--gray-400)', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }} />
                            </div>

                            {/* Card body */}
                            {!collapsed && (
                              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {group.rows.map((row, ri) => (
                                  <div key={ri} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                      <label className="form-label" style={{ marginBottom: 4 }}>{t('durationMin')}</label>
                                      <input
                                        type="number" className="form-input hide-arrows" value={row.duration}
                                        onChange={e => updateGroupRow(gi, ri, 'duration', e.target.value)}
                                        onFocus={selectAllOnFocus} min={15} step={15} required
                                        aria-invalid={durationError(row.duration)}
                                        style={durationError(row.duration) ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                                      />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                      <label className="form-label" style={{ marginBottom: 4 }}>{t('price')} (UZS)</label>
                                      <input
                                        type="text" inputMode="numeric" className="form-input price-input"
                                        value={formatPrice(row.price)}
                                        onChange={e => {
                                          const digits = e.target.value.replace(/\D/g, '')
                                          updateGroupRow(gi, ri, 'price', digits === '' ? '' : String(Number(digits)))
                                        }}
                                        onFocus={e => { if (Number(row.price) === 0) updateGroupRow(gi, ri, 'price', ''); else e.currentTarget.select() }}
                                        onBlur={() => { if (row.price === '') updateGroupRow(gi, ri, 'price', '0') }}
                                        placeholder="0" required
                                      />
                                    </div>
                                    <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ marginTop: 22, color: 'var(--danger)' }} onClick={() => removeGroupRow(gi, ri)} aria-label={`Remove price ${ri + 1}`} disabled={group.rows.length === 1}>
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                                <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', color: meta.color }} onClick={() => addGroupRow(gi)}>
                                  <Plus size={13} /> Add price
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add-plan mini flow */}
                  {planPicker === null && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPlanPicker('choose')}>
                      <Plus size={13} /> {t('addPlan')}
                    </button>
                  )}

                  {planPicker === 'choose' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)' }}>Who is this price for?</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPlanPicker('room'); setPickerCategory('') }}>
                          <BedDouble size={14} /> Room category
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPlanPicker('client'); setPickerCategory('') }}>
                          <Users size={14} /> Client group
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlanPicker(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {(planPicker === 'room' || planPicker === 'client') && (() => {
                    const opts = pickerOptions()
                    const emptyMsg = planPicker === 'room'
                      ? (!form.hotelId ? 'Select a hotel first.' : 'No more room categories for this hotel. Add them in Hotels & Rooms.')
                      : 'No more client groups. Create them in Client Groups.'
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)' }}>
                          Which {planPicker === 'room' ? 'room category' : 'client group'}?
                        </span>
                        {opts.length === 0 ? (
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', margin: 0 }}>{emptyMsg}</p>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                              className="form-select" style={{ width: 'auto', minWidth: 180 }}
                              value={pickerCategory} onChange={e => setPickerCategory(e.target.value)}
                              aria-label="Select category"
                            >
                              <option value="">Choose…</option>
                              {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <button type="button" className="btn btn-primary btn-sm" onClick={confirmAddGroup} disabled={!pickerCategory}>
                              <Check size={13} /> Add
                            </button>
                          </div>
                        )}
                        <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setPlanPicker(null); setPickerCategory('') }}>Cancel</button>
                      </div>
                    )
                  })()}

                  {/* Flat legacy price fallback when nothing else is defined */}
                  {form.pricingPlans.length === 0 && form.pricingGroups.length === 0 && planPicker === null && (
                    <div className="form-group" style={{ marginTop: 12 }}>
                      <label className="form-label" style={{ color: 'var(--gray-500)' }}>Flat {t('price')} (optional)</label>
                      <input type="number" className="form-input" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                    </div>
                  )}
                </div>
              </div>

              <div className="divider" />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                {!editService ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={discardDraft} style={{ color: 'var(--gray-400)' }}>
                    Discard draft
                  </button>
                ) : <span />}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeForm}>{t('cancel')}</button>
                  <button id="save-service-btn" type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner" /> : null}
                    {saving ? 'Saving…' : (editService ? 'Save Changes' : t('save'))}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
