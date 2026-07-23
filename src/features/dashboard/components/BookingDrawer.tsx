'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import {
  X,
  Check,
  Wallet,
  Plus,
  Pencil,
  RotateCcw,
  Trash2,
  Clock,
  CalendarDays,
  Phone,
  BedDouble,
  User,
  ExternalLink,
} from 'lucide-react'
import { Booking, Hotel, bookingState, money, svcId, amountCollected, amountDue, isPartiallyPaid } from '@/lib/bookingHelpers'
import { getServiceIcon } from '@/lib/serviceIcons'
import { MenuItemsEditor, type MenuItem } from '@/components/ui/MenuItemsEditor'
import Spinner from '@/components/ui/Spinner'
import { useTranslation, type DictionaryKeys } from '@/i18n'
import Button from '@/components/ui/Button'

interface Actor {
  _id?: string
  name?: string
  email?: string
}

interface BookingEvent {
  action: string
  at: string
  by?: Actor | string
  detail?: string
}

const INK_COLLECTED = '#059669'   // darker green for ink/stroke (contrast relief)
const FILL_COLLECTED = '#10b981'  // green fill

// Resolve an actor's display name; empty string when unknown (callers fall back
// to a translated "Admin").
const actorName = (a?: Actor | string) =>
  !a || typeof a === 'string' ? '' : a.name || a.email || ''

const EVENT_META: Record<string, { labelKey: DictionaryKeys; icon: React.ReactNode; color: string }> = {
  created: { labelKey: 'evCreated', icon: <Plus size={13} />, color: '#6366f1' },
  paid: { labelKey: 'evPaid', icon: <Wallet size={13} />, color: '#059669' },
  payment: { labelKey: 'evPayment', icon: <Wallet size={13} />, color: '#0891b2' },
  finished: { labelKey: 'evFinished', icon: <Check size={13} />, color: '#059669' },
  notes_updated: { labelKey: 'evNotesUpdated', icon: <Pencil size={13} />, color: '#64748b' },
  rescheduled: { labelKey: 'evRescheduled', icon: <CalendarDays size={13} />, color: '#0891b2' },
  reopened: { labelKey: 'evReopened', icon: <RotateCcw size={13} />, color: '#d97706' },
}

interface BookingDrawerProps {
  id: string
  hotels: Hotel[]
  serviceHotel: Map<string, string>
  onClose: () => void
  onChanged: (id: string, changes: Partial<Booking>) => void
  onDeleted: (id: string) => void
  router: any
  showToast: (m: string, t: 'success' | 'error' | 'info') => void
}

const TYPE_META: Record<string, { labelKey: DictionaryKeys; icon: React.ReactNode; color: string }> = {
  client: { labelKey: 'typeClient', icon: <User size={12} />, color: '#3b82f6' },
  room: { labelKey: 'typeRoom', icon: <BedDouble size={12} />, color: '#10b981' },
  custom: { labelKey: 'typeCustom', icon: <Pencil size={12} />, color: '#f59e0b' },
}

export default function BookingDrawer({
  id,
  hotels,
  serviceHotel,
  onClose,
  onChanged,
  onDeleted,
  router,
  showToast,
}: BookingDrawerProps) {
  const { lang, t } = useTranslation()
  const [b, setB] = useState<(Booking & { history?: BookingEvent[]; createdAt?: string; updatedAt?: string; createdBy?: Actor | string; bookingType?: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [payConfirm, setPayConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [editingMenu, setEditingMenu] = useState(false)
  const [menuDraft, setMenuDraft] = useState<MenuItem[]>([])
  const [menuReadyTimeDraft, setMenuReadyTimeDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchDetail = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`)
    const data = await res.json()
    if (res.ok) {
      setB(data)
      setNotesDraft(data.notes || '')
      setMenuDraft(data.menuItems || [])
      setMenuReadyTimeDraft(data.menuReadyTime || '')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  async function mutate(changes: Partial<Booking>, msg: string) {
    setBusy(true)
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    setBusy(false)
    if (res.ok) {
      const data = await res.json()
      setB(data)
      setNotesDraft(data.notes || '')
      setMenuDraft(data.menuItems || [])
      setMenuReadyTimeDraft(data.menuReadyTime || '')
      onChanged(id, changes)
      showToast(msg, 'success')
    } else showToast(t('updateFailed'), 'error')
  }

  async function del() {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t('bookingDeleted'), 'success')
      onDeleted(id)
    } else showToast(t('deleteFailed'), 'error')
  }

  const st = b ? bookingState(b) : null
  const hotel = b ? hotels.find(h => h._id === (serviceHotel.get(svcId(b)) || '')) : null

  // Build timeline from history (fallback to derived timestamps for legacy rows).
  const timeline = useMemo(() => {
    if (!b) return []
    if (b.history && b.history.length) {
      return [...b.history]
        .sort((a, c) => new Date(a.at).getTime() - new Date(c.at).getTime())
        .map(e => ({ action: e.action, at: e.at, by: actorName(e.by) }))
    }
    const evs: { action: string; at: string; by: string }[] = []
    if (b.createdAt) evs.push({ action: 'created', at: b.createdAt, by: actorName(b.createdBy) })
    if (b.paidAt) evs.push({ action: 'paid', at: b.paidAt, by: actorName(b.createdBy) })
    if (b.finishedAt) evs.push({ action: 'finished', at: b.finishedAt, by: actorName(b.createdBy) })
    return evs
  }, [b])

  return (
    <div className="fixed inset-0 z-[1200] flex justify-end">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
        style={{ animation: 'fadeIn 0.2s ease' }}
      />
      <div
        className="relative w-[min(440px,100%)] h-full bg-surface-card overflow-y-auto"
        style={{ boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', animation: 'slideInRight 0.25s ease-out' }}
      >
        {loading || !b || !st ? (
          <div className="p-16 text-center">
            <Spinner size={30} />
          </div>
        ) : (
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-[1.1rem]">
              <span
                className="w-10 h-10 shrink-0 flex items-center justify-center"
                style={{ background: `${b.serviceId?.color || '#6366f1'}1f`, color: b.serviceId?.color || '#6366f1' }}
              >
                {getServiceIcon(b.serviceId?.name || '')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-[800] text-[1.05rem] text-gray-900">
                  {b.customerName}
                </div>
                <div className="text-[0.78rem] text-gray-500">
                  {b.serviceId?.name}
                  {b.variantName ? ` · ${b.variantName}` : ''}
                  {hotel ? ` · ${hotel.shortName}` : ''}
                </div>
              </div>
              <Button variant="ghost" icon onClick={onClose} aria-label={t('close')}>
                <X size={18} />
              </Button>
            </div>

            {/* Status + price banner */}
            <div className="flex gap-2.5 mb-[1.1rem]">
              <div className="flex-1 p-[0.7rem_0.85rem]" style={{ background: st.bg }}>
                <div className="text-[0.66rem] font-bold uppercase tracking-[0.04em]" style={{ color: st.color }}>
                  {t('status')}
                </div>
                <div className="inline-flex items-center gap-1.25 font-[800] text-[0.95rem] mt-0.5" style={{ color: st.color }}>
                  {st.key === 'finished' && <Check size={14} />}
                  {t(st.key)}
                </div>
              </div>
              <div className="flex-1 p-[0.7rem_0.85rem] bg-gray-50">
                <div className="text-[0.66rem] font-bold text-gray-400 uppercase tracking-[0.04em]">
                  {t('price')}
                </div>
                <div className="font-[800] text-[0.95rem] text-gray-800 mt-0.5 tabular-nums">
                  {b.totalPrice > 0 ? `${money(b.totalPrice)} ${t('sum')}` : t('free')}
                </div>
                {isPartiallyPaid(b) && (
                  <div className="text-[0.72rem] text-cyan-600 mt-0.75 tabular-nums">
                    {t('collectedOfDue', { paid: money(amountCollected(b)), due: `${money(amountDue(b))} ${t('sum')}` })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-5">
              {!b.finished && (st.key === 'unpaid' || st.key === 'partial') && (
                <Button size="sm" className="flex-1" disabled={busy} onClick={() => setPayConfirm(true)}>
                  <Wallet size={14} /> {isPartiallyPaid(b) ? t('collectBalance') : t('markAsPaid')}
                </Button>
              )}
              {!b.finished && (st.key === 'paid' || st.key === 'free') && (
                <Button size="sm" className="flex-1 border-0" disabled={busy} onClick={() => mutate({ finished: true }, t('bookingCompleted'))} style={{ background: FILL_COLLECTED, color: '#fff' }}>
                  <Check size={15} strokeWidth={2.5} /> {t('markAsFinished')}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => router.push(`/${lang}/calendar?date=${b.date}`)} title={t('openInCalendar')}>
                <ExternalLink size={14} />
              </Button>
            </div>

            {/* Details grid */}
            <Section title={t('detailsTitle')}>
              <Field icon={<CalendarDays size={14} />} label={t('date')} value={format(parseISO(b.date), 'EEEE, MMM d, yyyy')} />
              <Field icon={<Clock size={14} />} label={t('time')} value={`${b.startTime} – ${b.endTime} (${b.duration} min)`} />
              {b.customerPhone && <Field icon={<Phone size={14} />} label={t('phone')} value={b.customerPhone} />}
              {b.roomNumber && <Field icon={<BedDouble size={14} />} label={t('room')} value={b.roomNumber} />}
              {b.bookingType && TYPE_META[b.bookingType] && <Field icon={TYPE_META[b.bookingType].icon} label={t('type')} value={t(TYPE_META[b.bookingType].labelKey)} />}
              <Field icon={<User size={14} />} label={t('bookedBy')} value={actorName(b.createdBy) || t('admin')} />
            </Section>

            {/* Notes */}
            <Section title={t('notes')} action={!editingNotes ? <Button variant="ghost" size="sm" className="px-1.5 py-0.5" onClick={() => setEditingNotes(true)}><Pencil size={12} /> {t('edit')}</Button> : undefined}>
              {editingNotes ? (
                <div>
                  <textarea className="form-textarea text-[0.82rem] min-h-17.5" value={notesDraft} onChange={e => setNotesDraft(e.target.value)} placeholder={t('addNotesPlaceholder')} />
                  <div className="flex gap-1.5 justify-end mt-1.5">
                    <Button variant="secondary" size="sm" onClick={() => { setEditingNotes(false); setNotesDraft(b.notes || '') }}>{t('cancel')}</Button>
                    <Button size="sm" disabled={busy} onClick={async () => { await mutate({ notes: notesDraft }, t('notesSaved')); setEditingNotes(false) }}>{t('save')}</Button>
                  </div>
                </div>
              ) : (
                <p className={`text-[0.82rem] m-0 whitespace-pre-wrap ${b.notes ? 'text-gray-700' : 'text-gray-400'}`}>{b.notes || t('noNotes')}</p>
              )}
            </Section>

            {/* Menu / order */}
            <Section title={t('menu')} action={!editingMenu ? <Button variant="ghost" size="sm" className="px-1.5 py-0.5" onClick={() => setEditingMenu(true)}><Pencil size={12} /> {t('edit')}</Button> : undefined}>
              {editingMenu ? (
                <div>
                  <MenuItemsEditor
                    items={menuDraft}
                    onAdd={() => setMenuDraft(items => [...items, { name: '', qty: 1, price: 0 }])}
                    onUpdate={(i, patch) => setMenuDraft(items => items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))}
                    onRemove={i => setMenuDraft(items => items.filter((_, idx) => idx !== i))}
                    readyTime={menuReadyTimeDraft}
                    onReadyTimeChange={setMenuReadyTimeDraft}
                  />
                  <div className="flex gap-1.5 justify-end mt-1.5">
                    <Button variant="secondary" size="sm" onClick={() => { setEditingMenu(false); setMenuDraft(b.menuItems || []); setMenuReadyTimeDraft(b.menuReadyTime || '') }}>{t('cancel')}</Button>
                    <Button size="sm" disabled={busy} onClick={async () => { await mutate({ menuItems: menuDraft.filter(it => it.name.trim()), menuReadyTime: menuReadyTimeDraft }, t('menuSaved')); setEditingMenu(false) }}>{t('save')}</Button>
                  </div>
                </div>
              ) : (
                <p className={`text-[0.82rem] m-0 whitespace-pre-wrap ${b.menuItems?.length ? 'text-gray-700' : 'text-gray-400'}`}>
                  {b.menuItems?.length
                    ? `${b.menuItems.map(it => `${it.qty}x ${it.name}`).join(', ')}${b.menuReadyTime ? ` · ${t('menuReadyTime')} ${b.menuReadyTime}` : ''}`
                    : t('noMenu')}
                </p>
              )}
            </Section>

            {/* Timeline */}
            <Section title={t('activity')}>
              <div className="relative pl-2">
                {timeline.map((e, i) => {
                  const meta = EVENT_META[e.action] || EVENT_META.notes_updated
                  const last = i === timeline.length - 1
                  return (
                    <div key={i} className="flex gap-3 relative" style={{ paddingBottom: last ? 0 : 18 }}>
                      {!last && <div className="absolute left-2.75 top-6 bottom-0 w-0.5 bg-gray-200" />}
                      <span
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center z-[1]"
                        style={{ background: `${meta.color}18`, color: meta.color }}
                      >{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.82rem] font-semibold text-gray-800">{t(meta.labelKey)}</div>
                        <div className="text-[0.72rem] text-gray-400">
                          {format(parseISO(e.at), 'MMM d, yyyy · HH:mm')} · {formatDistanceToNow(parseISO(e.at), { addSuffix: true })}
                          <span className="text-gray-300"> · {e.by || t('admin')}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {b.updatedAt && b.createdAt && new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime() > 1000 && (
                  <div className="text-[0.7rem] text-gray-400 mt-2.5 pl-9">
                    {t('lastEdited', { time: formatDistanceToNow(parseISO(b.updatedAt), { addSuffix: true }) })}
                  </div>
                )}
              </div>
            </Section>

            {/* Delete */}
            <div className="border-t border-surface-border pt-3.5 mt-1.5">
              {deleteConfirm ? (
                <div className="flex gap-2 items-center">
                  <span className="text-[0.8rem] text-danger mr-auto">{t('deleteThisBooking')}</span>
                  <Button variant="danger" size="sm" onClick={del}>{t('delete')}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>{t('cancel')}</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleteConfirm(true)}><Trash2 size={13} /> {t('deleteBooking')}</Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment confirm */}
      {payConfirm && b && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setPayConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 384 }}>
            <div className="flex flex-col items-center text-center gap-3">
              <span className="w-13 h-13 rounded-full flex items-center justify-center" style={{ background: '#10b98118', color: INK_COLLECTED }}>
                <Wallet size={24} />
              </span>
              <h2 className="m-0 text-[1.1rem]">{t('confirmPayment')}</h2>
              <p className="m-0 text-gray-600 text-[0.9rem] leading-relaxed">
                {t('didYouReceive', { amount: `${money(b.totalPrice)} ${t('sum')}`, name: b.customerName })}
              </p>
            </div>
            <div className="h-px bg-surface-border my-4" />
            <div className="flex gap-2.5">
              <Button variant="secondary" className="flex-1" onClick={() => setPayConfirm(false)}>
                {t('back')}
              </Button>
              <Button
                className="flex-1"
                disabled={busy}
                onClick={async () => {
                  await mutate({ paid: true }, t('markedAsPaid'))
                  setPayConfirm(false)
                }}
              >
                <Check size={15} strokeWidth={2.5} /> {t('yesReceived')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[0.72rem] m-0 text-gray-400 uppercase tracking-[0.05em] font-bold">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="text-gray-400 w-4 flex justify-center">
        {icon}
      </span>
      <span className="w-19 text-[0.78rem] text-gray-500 shrink-0">
        {label}
      </span>
      <span className="text-[0.82rem] text-gray-800 font-medium">
        {value}
      </span>
    </div>
  )
}
