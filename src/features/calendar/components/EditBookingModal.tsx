'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, CalendarDays, Clock, User, Phone, MapPin, Users, FileText } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { getBookings } from '@/lib/api/bookings'
import { generateTimeSlots, slotEnd, toMin } from '@/features/book/utils'
import { hoursForDate } from '@/lib/serviceHours'
import { MenuItemsEditor, type MenuItem } from '@/components/ui/MenuItemsEditor'
import Spinner from '@/components/ui/Spinner'
import type { Booking } from '@/types'
import type { CalendarPageState } from '../useCalendarPage'

type DayRow = { _id: string; startTime: string; endTime: string; status?: string; serviceId: string | { _id: string } }

// Reschedule + edit an existing booking: move it to another day/time (validated
// against the service's availability, excluding itself) and tweak guest details.
// Mounted with a `key={booking._id}` so state seeds cleanly per booking.
export function EditBookingModal({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation()
  const { editBooking: b, setEditBooking, saveBookingEdit, services } = s

  const service = useMemo(() => services.find(sv => sv._id === b?.serviceId?._id), [services, b])
  const duration = b?.duration || 60

  const [date, setDate] = useState(b?.date ?? '')
  const [startTime, setStartTime] = useState(b?.startTime ?? '')
  const [name, setName] = useState(b?.customerName ?? '')
  const [phone, setPhone] = useState(b?.customerPhone ?? '')
  const [room, setRoom] = useState(b?.roomNumber ?? '')
  const [persons, setPersons] = useState(b?.persons ?? 1)
  const [notes, setNotes] = useState(b?.notes ?? '')
  const [menuItems, setMenuItems] = useState<MenuItem[]>(b?.menuItems ?? [])
  const [menuReadyTime, setMenuReadyTime] = useState(b?.menuReadyTime ?? '')
  const [dayBookings, setDayBookings] = useState<DayRow[]>([])
  const [saving, setSaving] = useState(false)

  // Load the chosen day's bookings (minus this one) to compute free start times.
  useEffect(() => {
    if (!b || !date || !service?._id) return
    let alive = true
    getBookings(date, date)
      .then((data: unknown) => {
        if (!alive) return
        const rows = Array.isArray(data) ? (data as DayRow[]) : []
        setDayBookings(rows.filter(x =>
          x._id !== b._id && x.status !== 'cancelled' &&
          (typeof x.serviceId === 'string' ? x.serviceId : x.serviceId?._id) === service._id))
      })
      .catch(() => { if (alive) setDayBookings([]) })
    return () => { alive = false }
  }, [b, date, service?._id])

  if (!b) return null

  const bufBefore = service?.bufferTimeBefore || 0
  const bufAfter = service?.bufferTimeAfter || 0
  const capacity = service?.capacity || 1
  const dayHours = service ? hoursForDate(service, date) : { open: '00:00', close: '23:59', closed: false }
  const allSlots = dayHours.closed ? [] : generateTimeSlots(dayHours.open, dayHours.close, duration)
  const freeSlots = allSlots.filter(slot => {
    const start = toMin(slot)
    const end = start + duration
    const overlaps = dayBookings.filter(x => toMin(x.startTime) < end + bufAfter && toMin(x.endTime) > start - bufBefore).length
    return overlaps < capacity
  })
  // Always keep the booking's current start time selectable (unless the day is
  // closed, in which case nothing is bookable).
  const startOptions = dayHours.closed
    ? []
    : startTime && !freeSlots.includes(startTime) ? [startTime, ...freeSlots] : freeSlots

  const endTime = startTime ? slotEnd(startTime, duration) : b.endTime
  const changed =
    date !== b.date || startTime !== b.startTime || name.trim() !== b.customerName ||
    phone.trim() !== (b.customerPhone || '') || room.trim() !== (b.roomNumber || '') ||
    persons !== (b.persons || 1) || notes.trim() !== (b.notes || '') ||
    JSON.stringify(menuItems) !== JSON.stringify(b.menuItems || []) || menuReadyTime !== (b.menuReadyTime || '')

  const close = () => setEditBooking(null)

  async function save() {
    if (!b || !changed) return
    setSaving(true)
    await saveBookingEdit(b._id, {
      date,
      startTime,
      endTime,
      customerName: name.trim() || b.customerName,
      customerPhone: phone.trim(),
      roomNumber: room.trim(),
      persons,
      notes: notes.trim(),
      menuItems: menuItems.filter(it => it.name.trim()).map(it => ({ ...it, name: it.name.trim() })),
      menuReadyTime,
    } as Partial<Booking>)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2100 }} onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2>{t('editBooking')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={close} aria-label={t('close')}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label"><CalendarDays size={13} /> {t('date')}</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label"><Clock size={13} /> {t('time')}</label>
              <select className="form-select" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={dayHours.closed}>
                {startOptions.length === 0 && <option value="">{dayHours.closed ? t('serviceClosedOnDate') : t('noSlotsAvailable')}</option>}
                {startOptions.map(slot => (
                  <option key={slot} value={slot}>{slot} – {slotEnd(slot, duration)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><User size={13} /> {t('guest')}</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label"><Phone size={13} /> {t('phone')}</label>
              <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label"><MapPin size={13} /> {t('room')}</label>
              <input type="text" className="form-input" value={room} onChange={e => setRoom(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 160 }}>
            <label className="form-label"><Users size={13} /> {t('personsCount')}</label>
            <input
              type="number" className="form-input" min={1} step={1} value={persons}
              onChange={e => setPersons(Math.max(1, parseInt(e.target.value) || 1))}
              onFocus={e => e.currentTarget.select()}
            />
          </div>

          <div className="form-group">
            <label className="form-label"><FileText size={13} /> {t('notes')}</label>
            <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <MenuItemsEditor
            items={menuItems}
            onAdd={() => setMenuItems(items => [...items, { name: '', qty: 1, price: 0 }])}
            onUpdate={(i, patch) => setMenuItems(items => items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))}
            onRemove={i => setMenuItems(items => items.filter((_, idx) => idx !== i))}
            readyTime={menuReadyTime}
            onReadyTimeChange={setMenuReadyTime}
          />
        </div>

        <div className="h-px bg-surface-border my-4" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={close}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={saving || !changed || !startTime || dayHours.closed} onClick={save}>
            {saving ? <Spinner size={18} dark={false} /> : null}{t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}
