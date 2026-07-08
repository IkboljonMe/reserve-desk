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
import { Booking, Hotel, bookingState, money, svcId } from '@/lib/bookingHelpers'
import { getServiceIcon } from '@/lib/serviceIcons'
import { useTranslation } from '@/i18n'

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

const actorName = (a?: Actor | string) =>
  !a || typeof a === 'string' ? 'Admin' : a.name || a.email || 'Admin'

const EVENT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { label: 'Created', icon: <Plus size={13} />, color: '#6366f1' },
  paid: { label: 'Marked paid', icon: <Wallet size={13} />, color: '#059669' },
  finished: { label: 'Completed', icon: <Check size={13} />, color: '#059669' },
  notes_updated: { label: 'Notes updated', icon: <Pencil size={13} />, color: '#64748b' },
  reopened: { label: 'Reopened', icon: <RotateCcw size={13} />, color: '#d97706' },
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

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  client: { label: 'Client', icon: <User size={12} />, color: '#3b82f6' },
  room: { label: 'Room', icon: <BedDouble size={12} />, color: '#10b981' },
  custom: { label: 'Custom', icon: <Pencil size={12} />, color: '#f59e0b' },
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
  const { lang } = useTranslation()
  const [b, setB] = useState<(Booking & { history?: BookingEvent[]; createdAt?: string; updatedAt?: string; createdBy?: Actor | string; bookingType?: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [payConfirm, setPayConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [busy, setBusy] = useState(false)

  const fetchDetail = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`)
    const data = await res.json()
    if (res.ok) {
      setB(data)
      setNotesDraft(data.notes || '')
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
      onChanged(id, changes)
      showToast(msg, 'success')
    } else showToast('Update failed', 'error')
  }

  async function del() {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Booking deleted', 'success')
      onDeleted(id)
    } else showToast('Delete failed', 'error')
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', justifyContent: 'flex-end' }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', animation: 'fadeIn 0.2s ease' }}
      />
      <div
        style={{
          position: 'relative',
          width: 'min(440px, 100%)',
          height: '100%',
          background: 'var(--surface-card, #fff)',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
          overflowY: 'auto',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {loading || !b || !st ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="spinner spinner-dark" style={{ width: 30, height: 30, margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{ padding: '1.25rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  flexShrink: 0,
                  background: `${b.serviceId?.color || '#6366f1'}1f`,
                  color: b.serviceId?.color || '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getServiceIcon(b.serviceId?.name || '')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gray-900)' }}>
                  {b.customerName}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-50)' }}>
                  {b.serviceId?.name}
                  {hotel ? ` · ${hotel.shortName}` : ''}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Status + price banner */}
            <div style={{ display: 'flex', gap: 10, marginBottom: '1.1rem' }}>
              <div style={{ flex: 1, padding: '0.7rem 0.85rem', borderRadius: 10, background: st.badge === 'badge-success' ? '#ecfdf5' : st.badge === 'badge-warning' ? '#fffbeb' : '#eff6ff' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: st.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Status
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 800, fontSize: '0.95rem', color: st.color, marginTop: 2 }}>
                  {st.key === 'finished' && <Check size={14} />}
                  {st.label}
                </div>
              </div>
              <div style={{ flex: 1, padding: '0.7rem 0.85rem', borderRadius: 10, background: 'var(--gray-50)' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Price
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--gray-800)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {b.totalPrice > 0 ? `${money(b.totalPrice)} UZS` : 'Free'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
              {!b.finished && st.key === 'unpaid' && (
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={busy} onClick={() => setPayConfirm(true)}>
                  <Wallet size={14} /> Mark as Paid
                </button>
              )}
              {!b.finished && st.key !== 'unpaid' && (
                <button className="btn btn-sm" style={{ flex: 1, background: FILL_COLLECTED, color: '#fff', border: 'none' }} disabled={busy} onClick={() => mutate({ finished: true }, 'Booking completed')}>
                  <Check size={15} strokeWidth={2.5} /> Mark as Finished
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/${lang}/calendar?date=${b.date}`)} title="Open in calendar">
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Details grid */}
            <Section title="Details">
              <Field icon={<CalendarDays size={14} />} label="Date" value={format(parseISO(b.date), 'EEEE, MMM d, yyyy')} />
              <Field icon={<Clock size={14} />} label="Time" value={`${b.startTime} – ${b.endTime} (${b.duration} min)`} />
              {b.customerPhone && <Field icon={<Phone size={14} />} label="Phone" value={b.customerPhone} />}
              {b.roomNumber && <Field icon={<BedDouble size={14} />} label="Room" value={b.roomNumber} />}
              {b.bookingType && <Field icon={TYPE_META[b.bookingType]?.icon} label="Type" value={TYPE_META[b.bookingType]?.label} />}
              <Field icon={<User size={14} />} label="Booked by" value={actorName(b.createdBy)} />
            </Section>

            {/* Notes */}
            <Section title="Notes" action={!editingNotes ? <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => setEditingNotes(true)}><Pencil size={12} /> Edit</button> : undefined}>
              {editingNotes ? (
                <div>
                  <textarea className="form-textarea" value={notesDraft} onChange={e => setNotesDraft(e.target.value)} style={{ minHeight: 70, fontSize: '0.82rem' }} placeholder="Add notes…" />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingNotes(false); setNotesDraft(b.notes || '') }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={async () => { await mutate({ notes: notesDraft }, 'Notes saved'); setEditingNotes(false) }}>Save</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: b.notes ? 'var(--gray-700)' : 'var(--gray-400)', margin: 0, whiteSpace: 'pre-wrap' }}>{b.notes || 'No notes.'}</p>
              )}
            </Section>

            {/* Timeline */}
            <Section title="Activity">
              <div style={{ position: 'relative', paddingLeft: 8 }}>
                {timeline.map((e, i) => {
                  const meta = EVENT_META[e.action] || EVENT_META.notes_updated
                  const last = i === timeline.length - 1
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: last ? 0 : 18 }}>
                      {!last && <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 2, background: 'var(--gray-200)' }} />}
                      <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: `${meta.color}18`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-800)' }}>{meta.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                          {format(parseISO(e.at), 'MMM d, yyyy · HH:mm')} · {formatDistanceToNow(parseISO(e.at), { addSuffix: true })}
                          <span style={{ color: 'var(--gray-300)' }}> · {e.by}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {b.updatedAt && b.createdAt && new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime() > 1000 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 10, paddingLeft: 36 }}>
                    Last edited {formatDistanceToNow(parseISO(b.updatedAt), { addSuffix: true })}
                  </div>
                )}
              </div>
            </Section>

            {/* Delete */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 14, marginTop: 6 }}>
              {deleteConfirm ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginRight: 'auto' }}>Delete this booking?</span>
                  <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(true)}><Trash2 size={13} /> Delete booking</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment confirm */}
      {payConfirm && b && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setPayConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 384 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
              <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#10b98118', color: INK_COLLECTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={24} />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Confirm payment</h2>
              <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Did you receive <strong style={{ color: 'var(--gray-900)' }}>{money(b.totalPrice)} UZS</strong> from <strong style={{ color: 'var(--gray-900)' }}>{b.customerName}</strong>?
              </p>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPayConfirm(false)}>
                Back
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={busy}
                onClick={async () => {
                  await mutate({ paid: true }, 'Marked as paid')
                  setPayConfirm(false)
                }}
              >
                <Check size={15} strokeWidth={2.5} /> Yes, received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ fontSize: '0.72rem', margin: 0, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
      <span style={{ color: 'var(--gray-400)', width: 16, display: 'flex', justifyContent: 'center' }}>
        {icon}
      </span>
      <span style={{ width: 76, fontSize: '0.78rem', color: 'var(--gray-500)', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--gray-800)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}
