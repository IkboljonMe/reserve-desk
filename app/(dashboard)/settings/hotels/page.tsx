'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useToast } from '@/components/ToastProvider'
import Select from '@/components/Select'
import {
  Building2, MapPin, Layers, Trash2, Plus, DoorClosed, TriangleAlert,
  Check, X, BedDouble, Pencil, GripVertical,
} from 'lucide-react'

interface Hotel {
  _id: string
  name: string
  shortName: string
  location: string
  roomTypes: string[]
}

interface Room {
  _id: string
  hotelId: string
  number: string
  floor: number
  type: string
}

const SHORT_NAME_RE = /^[A-Z0-9]{2,6}$/

// Build a suggested compact code from a full hotel name: initials of the first
// few significant words. "Fergana Grand Hotel" -> "FG" (skips "Hotel").
function suggestShortName(fullName: string): string {
  const stop = new Set(['hotel', 'the', 'and', 'of', 'resort', 'inn'])
  const words = fullName
    .split(/\s+/)
    .map(w => w.replace(/[^A-Za-z0-9]/g, ''))
    .filter(w => w && !stop.has(w.toLowerCase()))
  const letters = words.map(w => w[0]).join('').toUpperCase()
  return letters.slice(0, 4)
}

// A code that's always safe to display: the stored shortName, or one derived
// from the name for legacy hotels that predate the shortName field.
function displayCode(hotel: { shortName?: string; name: string }): string {
  if (hotel.shortName) return hotel.shortName
  const suggested = suggestShortName(hotel.name)
  if (suggested.length >= 2) return suggested
  return hotel.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'HTL'
}

export default function HotelsRoomsPage() {
  const { showToast } = useToast()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  // Hotel modal
  const [hotelOpen, setHotelOpen] = useState(false)
  const [editHotelId, setEditHotelId] = useState<string | null>(null)
  const [hotelForm, setHotelForm] = useState({ name: '', shortName: '', location: '', roomTypes: [] as string[] })
  const [shortNameTouched, setShortNameTouched] = useState(false)
  const [savingHotel, setSavingHotel] = useState(false)
  const [hotelDeleteConfirm, setHotelDeleteConfirm] = useState<string | null>(null)

  const [roomCategoryInput, setRoomCategoryInput] = useState('')

  // Room modal
  const [roomOpen, setRoomOpen] = useState(false)
  const [editRoomId, setEditRoomId] = useState<string | null>(null)
  const [roomForm, setRoomForm] = useState({ hotelId: '', number: '', floor: 1, type: '' })
  const [savingRoom, setSavingRoom] = useState(false)
  const [roomDeleteConfirm, setRoomDeleteConfirm] = useState<string | null>(null)

  // Drag-to-reorder within a hotel+floor group
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null)
  const roomsRef = useRef<Room[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [hRes, rRes] = await Promise.all([fetch('/api/hotels'), fetch('/api/rooms')])
      const hData = await hRes.json()
      const rData = await rRes.json()
      setHotels(Array.isArray(hData) ? hData : [])
      setRooms(Array.isArray(rData) ? rData : [])
    } catch {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const [seeding, setSeeding] = useState(false)

  async function handleSeed() {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showToast('Database seeded successfully!', 'success')
        load()
      } else {
        showToast(data.error || 'Failed to seed database', 'error')
      }
    } catch {
      showToast('Connection error during seeding', 'error')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => { load() }, [load])
  useEffect(() => { roomsRef.current = rooms }, [rooms])

  const hotelById = useMemo(() => {
    const m = new Map<string, Hotel>()
    hotels.forEach(h => m.set(h._id, h))
    return m
  }, [hotels])

  // ---- Hotel form -----------------------------------------------------------

  function openHotelModal() {
    setEditHotelId(null)
    setHotelForm({ name: '', shortName: '', location: '', roomTypes: [] })
    setRoomCategoryInput('')
    setShortNameTouched(false)
    setHotelOpen(true)
  }

  function openEditHotel(hotel: Hotel) {
    setEditHotelId(hotel._id)
    setHotelForm({ name: hotel.name, shortName: displayCode(hotel), location: hotel.location || '', roomTypes: hotel.roomTypes || [] })
    setRoomCategoryInput('')
    setShortNameTouched(true) // don't auto-overwrite an existing code from the name
    setHotelOpen(true)
  }

  // Auto-suggest a short name from the full name until the user edits it manually.
  function onHotelNameChange(value: string) {
    setHotelForm(f => ({
      ...f,
      name: value,
      shortName: shortNameTouched ? f.shortName : suggestShortName(value),
    }))
  }

  function onShortNameChange(value: string) {
    setShortNameTouched(true)
    setHotelForm(f => ({ ...f, shortName: value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))
  }

  // Live validation of the compact code.
  const shortNameError = useMemo(() => {
    const sn = hotelForm.shortName.trim().toUpperCase()
    if (!sn) return null // handled by `required`
    if (!SHORT_NAME_RE.test(sn)) return 'Use 2–6 letters or digits (e.g. FG, FGH1)'
    if (hotels.some(h => h._id !== editHotelId && h.shortName?.toUpperCase() === sn)) {
      return `"${sn}" is already used by another hotel`
    }
    return null
  }, [hotelForm.shortName, hotels, editHotelId])

  async function handleSubmitHotel(e: React.FormEvent) {
    e.preventDefault()

    // Auto-append anything typed in the field before submitting
    const finalForm = { ...hotelForm }
    const pendingCat = roomCategoryInput.trim()
    if (pendingCat && !finalForm.roomTypes.includes(pendingCat)) {
       finalForm.roomTypes.push(pendingCat)
    }

    if (!finalForm.name.trim() || !finalForm.shortName.trim() || shortNameError) return
    if (finalForm.roomTypes.length === 0) {
      showToast('Please add at least one room category', 'error')
      return
    }
    setSavingHotel(true)
    try {
      const res = await fetch(editHotelId ? `/api/hotels/${editHotelId}` : '/api/hotels', {
        method: editHotelId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalForm),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(editHotelId ? 'Hotel updated' : 'Hotel added', 'success')
        setHotelOpen(false)
        setEditHotelId(null)
        load()
      } else {
        showToast(data.error || 'Failed to save hotel', 'error')
      }
    } finally {
      setSavingHotel(false)
    }
  }

  async function handleDeleteHotel(id: string) {
    const res = await fetch(`/api/hotels/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Hotel deleted', 'success')
      setHotelDeleteConfirm(null)
      load()
    } else {
      showToast('Failed to delete hotel', 'error')
    }
  }

  // ---- Room form ------------------------------------------------------------

  function openRoomModal() {
    if (hotels.length === 0) {
      showToast('Add a hotel first', 'info')
      return
    }
    const h = hotels[0]
    setEditRoomId(null)
    setRoomForm({ hotelId: h._id, number: '', floor: 1, type: h.roomTypes?.[0] || '' })
    setRoomOpen(true)
  }

  function openEditRoom(room: Room) {
    setEditRoomId(room._id)
    setRoomForm({ hotelId: room.hotelId, number: room.number, floor: room.floor, type: room.type || '' })
    setRoomOpen(true)
  }

  const roomHotel = hotelById.get(roomForm.hotelId)
  const roomShort = roomHotel ? displayCode(roomHotel) : '??'

  async function handleSubmitRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!roomForm.hotelId || !roomForm.number.trim()) return
    setSavingRoom(true)
    try {
      const res = await fetch(editRoomId ? `/api/rooms/${editRoomId}` : '/api/rooms', {
        method: editRoomId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomForm),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(editRoomId ? 'Room updated' : 'Room added', 'success')
        setRoomOpen(false)
        setEditRoomId(null)
        load()
      } else {
        showToast(data.error || 'Failed to save room', 'error')
      }
    } finally {
      setSavingRoom(false)
    }
  }

  // ---- Drag-to-reorder rooms within the same hotel + floor ------------------

  function handleRoomDragOver(e: React.DragEvent, target: Room) {
    if (!draggingRoomId || draggingRoomId === target._id) return
    const dragged = rooms.find(r => r._id === draggingRoomId)
    if (!dragged || dragged.hotelId !== target.hotelId || dragged.floor !== target.floor) return
    e.preventDefault() // allow drop
    setRooms(prev => {
      const arr = [...prev]
      const from = arr.findIndex(r => r._id === draggingRoomId)
      const to = arr.findIndex(r => r._id === target._id)
      if (from === -1 || to === -1 || from === to) return prev
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      return arr
    })
  }

  // Persist the new order of the given hotel+floor group from the latest state.
  async function persistRoomOrder(hotelId: string, floor: number) {
    const ids = roomsRef.current
      .filter(r => r.hotelId === hotelId && r.floor === floor)
      .map(r => r._id)
    try {
      await fetch('/api/rooms/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
    } catch {
      showToast('Failed to save room order', 'error')
    }
  }

  function handleRoomDrop(hotelId: string, floor: number) {
    setDraggingRoomId(null)
    persistRoomOrder(hotelId, floor)
  }

  async function handleDeleteRoom(id: string) {
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Room deleted', 'success')
      setRoomDeleteConfirm(null)
      load()
    } else {
      showToast('Failed to delete room', 'error')
    }
  }

  // Move a room to a hotel (used to repair rooms that lost their hotel link).
  async function assignRoomToHotel(roomId: string, hotelId: string) {
    if (!hotelId) return
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId }),
    })
    const data = await res.json()
    if (res.ok) {
      showToast('Room assigned', 'success')
      load()
    } else {
      showToast(data.error || 'Failed to assign room', 'error')
    }
  }

  // Rooms grouped by hotel, then floor.
  const roomsByHotel = useMemo(() => {
    const groups = new Map<string, Room[]>()
    rooms.forEach(r => {
      const list = groups.get(r.hotelId) || []
      list.push(r)
      groups.set(r.hotelId, list)
    })
    return groups
  }, [rooms])

  // Rooms whose hotel no longer exists (or was never set) — shown separately
  // so they're never invisible.
  const unassignedRooms = useMemo(
    () => rooms.filter(r => !r.hotelId || !hotelById.has(r.hotelId)),
    [rooms, hotelById],
  )
  const hasAnyGroupedRooms = useMemo(
    () => hotels.some(h => (roomsByHotel.get(h._id) || []).length > 0),
    [hotels, roomsByHotel],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* ============================ HOTELS ============================ */}
      <section>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} style={{ color: 'var(--brand-600)' }} /> Hotels
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: 2 }}>
              Each hotel has a unique compact code used to name its rooms (e.g. <strong>FG</strong> → FG-202).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Seeding...' : 'Seed Safir Demo Data'}
            </button>
            <button className="btn btn-primary" onClick={openHotelModal}>
              <Plus size={15} strokeWidth={2.5} /> Add Hotel
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
          </div>
        ) : hotels.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Building2 size={26} /></div>
              <h3>No hotels added yet</h3>
              <p>Add hotels to group your rooms and services.</p>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openHotelModal}>Add First Hotel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
            {hotels.map(hotel => {
              const roomCount = (roomsByHotel.get(hotel._id) || []).length
              return (
                <div key={hotel._id} className="card" style={{ padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 46, height: 40, padding: '0 10px', borderRadius: 10,
                      background: 'var(--brand-500)', color: '#fff',
                      fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}>
                      {displayCode(hotel)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hotel.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {hotel.location || 'No location set'}
                      </div>
                    </div>
                    {hotelDeleteConfirm === hotel._id ? (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteHotel(hotel._id)} aria-label="Confirm delete hotel"><Check size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setHotelDeleteConfirm(null)} aria-label="Cancel delete"><X size={14} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditHotel(hotel)} title="Edit hotel" aria-label="Edit hotel">
                          <Pencil size={15} />
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setHotelDeleteConfirm(hotel._id)} title="Delete hotel" aria-label="Delete hotel">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--gray-500)', paddingTop: 10, borderTop: '1px solid var(--surface-border)' }}>
                    <BedDouble size={13} />
                    <span className="tabular-nums">{roomCount}</span> {roomCount === 1 ? 'room' : 'rooms'}
                    {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                        {hotel.roomTypes.slice(0, 3).map(rt => <span key={rt} style={{ background: 'var(--brand-50)', color: 'var(--brand-600)', padding: '2px 6px', borderRadius: 6, fontWeight: 600, fontSize: '0.68rem' }}>{rt}</span>)}
                        {hotel.roomTypes.length > 3 && <span>+{hotel.roomTypes.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ============================ ROOMS ============================ */}
      <section>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BedDouble size={18} style={{ color: 'var(--brand-600)' }} /> Rooms
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: 2 }}>
              Rooms are named with their hotel’s code, like <strong>FG-202</strong>.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openRoomModal}>
            <Plus size={15} strokeWidth={2.5} /> Add Room
          </button>
        </div>

        {loading ? null : rooms.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><BedDouble size={26} /></div>
              <h3>No rooms added yet</h3>
              <p>Add rooms to a hotel to use room selection during booking.</p>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={openRoomModal}>Add First Room</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Unassigned rooms — visible so nothing is ever hidden, with a repair control */}
            {unassignedRooms.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #fcd34d' }}>
                <div style={{ padding: '0.75rem 1.25rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TriangleAlert size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#92400e' }}>
                      {unassignedRooms.length} unassigned {unassignedRooms.length === 1 ? 'room' : 'rooms'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#b45309' }}>These rooms aren’t linked to a hotel. Assign each one below.</div>
                  </div>
                </div>
                {unassignedRooms.map(room => (
                  <div key={room._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.9375rem', minWidth: 60 }} className="tabular-nums">
                      #{room.number}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>Floor {room.floor}</span>
                    <div style={{ flex: 1, maxWidth: 260 }}>
                      <Select
                        ariaLabel={`Assign room ${room.number} to a hotel`}
                        placeholder="Assign to hotel…"
                        icon={<Building2 size={15} />}
                        value=""
                        onChange={v => assignRoomToHotel(room._id, v)}
                        options={hotels.map(h => ({ value: h._id, label: `${displayCode(h)} · ${h.name}` }))}
                      />
                    </div>
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteRoom(room._id)} title="Delete room" aria-label="Delete room">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hotels.filter(h => (roomsByHotel.get(h._id) || []).length > 0).map(hotel => {
              const hotelRooms = roomsByHotel.get(hotel._id) || []
              const floors = Array.from(new Set(hotelRooms.map(r => r.floor))).sort((a, b) => a - b)
              return (
                <div key={hotel._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    padding: '0.75rem 1.25rem',
                    background: 'var(--gray-50)',
                    borderBottom: '1px solid var(--gray-200)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 40, height: 26, padding: '0 8px', borderRadius: 7,
                      background: 'var(--brand-500)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.03em',
                    }}>
                      {displayCode(hotel)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray-700)' }}>{hotel.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--gray-400)' }} className="tabular-nums">
                      {hotelRooms.length} {hotelRooms.length === 1 ? 'room' : 'rooms'}
                    </span>
                  </div>
                  {floors.map(floor => (
                    <div key={floor}>
                      <div style={{
                        padding: '0.4rem 1.25rem',
                        background: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--gray-400)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--gray-100)',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <Layers size={11} /> Floor {floor}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1, background: 'var(--gray-200)' }}>
                        {hotelRooms.filter(r => r.floor === floor).map(room => {
                          const isDragging = draggingRoomId === room._id
                          return (
                          <div
                            key={room._id}
                            onDragOver={e => handleRoomDragOver(e, room)}
                            onDrop={() => handleRoomDrop(room.hotelId, room.floor)}
                            style={{
                              background: '#fff', padding: '0.875rem 1rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                              opacity: isDragging ? 0.4 : 1,
                              transition: 'opacity 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <span
                                draggable
                                onDragStart={e => { setDraggingRoomId(room._id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', room._id) }}
                                onDragEnd={() => setDraggingRoomId(null)}
                                title="Drag to reorder"
                                aria-label="Drag to reorder room"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', color: 'var(--gray-300)',
                                  cursor: 'grab', flexShrink: 0, touchAction: 'none',
                                }}
                              >
                                <GripVertical size={16} />
                              </span>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                background: 'var(--brand-50)', color: 'var(--brand-600)',
                              }}>
                                <DoorClosed size={16} />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.9375rem' }} className="tabular-nums">
                                  {displayCode(hotel)}-{room.number}
                                  {room.type && (
                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', fontWeight: 600, color: 'var(--brand-600)', background: 'var(--brand-50)', padding: '2px 6px', borderRadius: 6, verticalAlign: 'middle' }}>
                                      {room.type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {roomDeleteConfirm === room._id ? (
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteRoom(room._id)} aria-label="Confirm delete room"><Check size={14} /></button>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setRoomDeleteConfirm(null)} aria-label="Cancel delete"><X size={14} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditRoom(room)} title="Edit room" aria-label="Edit room">
                                  <Pencil size={14} />
                                </button>
                                <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setRoomDeleteConfirm(room._id)} title="Delete room" aria-label="Delete room">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            {/* All rooms are unassigned — nudge toward assigning them */}
            {!hasAnyGroupedRooms && unassignedRooms.length > 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)', textAlign: 'center', padding: '0.5rem' }}>
                Assign the rooms above to a hotel to see them grouped here.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ===================== Add Hotel Modal ===================== */}
      {hotelOpen && (
        <div className="modal-overlay" onClick={() => setHotelOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editHotelId ? 'Edit Hotel' : 'Add Hotel'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setHotelOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmitHotel}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Hotel Name *</label>
                  <input
                    className="form-input"
                    required
                    value={hotelForm.name}
                    onChange={e => onHotelNameChange(e.target.value)}
                    placeholder="e.g. Fergana Grand Hotel"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Short Code *</label>
                  <input
                    className="form-input"
                    required
                    value={hotelForm.shortName}
                    onChange={e => onShortNameChange(e.target.value)}
                    placeholder="e.g. FG"
                    maxLength={6}
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                      ...(shortNameError ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : {}),
                    }}
                    aria-invalid={!!shortNameError}
                  />
                  {shortNameError ? (
                    <small className="form-error" style={{ display: 'block', marginTop: 4 }}>{shortNameError}</small>
                  ) : (
                    <small style={{ color: 'var(--gray-400)', fontSize: '0.72rem', display: 'block', marginTop: 4 }}>
                      Unique 2–6 char code. Used to name rooms — e.g. {hotelForm.shortName || 'FG'}-202.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    value={hotelForm.location}
                    onChange={e => setHotelForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Fergana, Uzbekistan"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room Categories</label>
                  {hotelForm.roomTypes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {hotelForm.roomTypes.map((rt, i) => (
                        <span key={i} style={{ background: 'var(--brand-100)', color: 'var(--brand-700)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {rt}
                          <button type="button" onClick={() => setHotelForm(f => ({ ...f, roomTypes: f.roomTypes.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    className="form-input"
                    value={roomCategoryInput}
                    onChange={e => setRoomCategoryInput(e.target.value)}
                    placeholder="Type category (e.g. Standard) and press Enter"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault() // prevent submitting the whole hotel form
                        const val = e.currentTarget.value.trim()
                        if (val && !hotelForm.roomTypes.includes(val)) {
                          setHotelForm(f => ({ ...f, roomTypes: [...f.roomTypes, val] }))
                          setRoomCategoryInput('')
                        }
                      }
                    }}
                  />
                  <small style={{ color: 'var(--gray-400)', fontSize: '0.72rem', display: 'block', marginTop: 4 }}>
                    Optional. Define categories to classify rooms (e.g., Standard, Lux). Keep alphabetical order or edit as needed.
                  </small>
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setHotelOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingHotel || !!shortNameError}>
                  {savingHotel ? <span className="spinner" /> : null}
                  {savingHotel ? (editHotelId ? 'Saving…' : 'Adding…') : (editHotelId ? 'Save Changes' : 'Add Hotel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== Add / Edit Room Modal ===================== */}
      {roomOpen && (
        <div className="modal-overlay" onClick={() => setRoomOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editRoomId ? 'Edit Room' : 'Add Room'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setRoomOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmitRoom}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Hotel *</label>
                  <Select
                    ariaLabel="Hotel"
                    placeholder="Select hotel"
                    icon={<Building2 size={16} />}
                    value={roomForm.hotelId}
                    onChange={v => {
                      const h = hotelById.get(v)
                      setRoomForm(f => ({ ...f, hotelId: v, type: h?.roomTypes?.[0] || '' }))
                    }}
                    options={hotels.map(h => ({ value: h._id, label: `${displayCode(h)} · ${h.name}` }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Floor *</label>
                    <input
                      className="form-input"
                      type="number"
                      min={0}
                      required
                      value={roomForm.floor}
                      onChange={e => setRoomForm(f => ({ ...f, floor: parseInt(e.target.value) || 1 }))}
                      placeholder="2"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Number *</label>
                    <input
                      className="form-input"
                      required
                      value={roomForm.number}
                      onChange={e => setRoomForm(f => ({ ...f, number: e.target.value }))}
                      placeholder="202"
                    />
                  </div>
                </div>

                {roomHotel && roomHotel.roomTypes && roomHotel.roomTypes.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <Select
                      ariaLabel="Room Category"
                      placeholder="Select category"
                      value={roomForm.type}
                      onChange={v => setRoomForm(f => ({ ...f, type: v }))}
                      options={roomHotel.roomTypes.map(t => ({ value: t, label: t }))}
                    />
                  </div>
                )}

                {/* Live preview of the generated room name */}
                <div style={{
                  background: 'var(--brand-50)',
                  border: '1px solid var(--brand-100)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: '0.8125rem',
                  color: 'var(--brand-700)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  Room name:&nbsp;
                  <strong style={{ fontSize: '0.9375rem', fontVariantNumeric: 'tabular-nums' }}>
                    {roomShort}-{roomForm.number || '###'}
                  </strong>
                </div>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRoomOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingRoom}>
                  {savingRoom ? <span className="spinner" /> : null}
                  {savingRoom ? 'Saving…' : editRoomId ? 'Save Changes' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
