'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { Hotel, Room } from './types'
import { SHORT_NAME_RE, suggestShortName, displayCode } from './utils'

export function useHotelsRoomsPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  // Hotel modal
  const [hotelOpen, setHotelOpen] = useState(false)
  const [editHotelId, setEditHotelId] = useState<string | null>(null)
  const [hotelForm, setHotelForm] = useState({ name: '', shortName: '', slug: '', location: '', roomTypes: [] as string[] })
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
      showToast(t('loadDataFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setHotelForm({ name: '', shortName: '', slug: '', location: '', roomTypes: [] })
    setRoomCategoryInput('')
    setShortNameTouched(false)
    setHotelOpen(true)
  }

  function openEditHotel(hotel: Hotel) {
    setEditHotelId(hotel._id)
    setHotelForm({ name: hotel.name, shortName: displayCode(hotel), slug: hotel.slug || '', location: hotel.location || '', roomTypes: hotel.roomTypes || [] })
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

  // Owner-editable URL slug; keystrokes are normalized to slug characters.
  // Left empty, the server derives it from the hotel name.
  function onSlugChange(value: string) {
    setHotelForm(f => ({ ...f, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
  }

  const slugError = useMemo(() => {
    const v = hotelForm.slug.trim()
    if (!v) return null // empty → server default from name
    if (hotels.some(h => h._id !== editHotelId && h.slug === v)) {
      return t('hotelSlugTaken')
    }
    return null
  }, [hotelForm.slug, hotels, editHotelId, t])

  // Live validation of the compact code.
  const shortNameError = useMemo(() => {
    const sn = hotelForm.shortName.trim().toUpperCase()
    if (!sn) return null // handled by `required`
    if (!SHORT_NAME_RE.test(sn)) return t('shortCodeFormat')
    if (hotels.some(h => h._id !== editHotelId && h.shortName?.toUpperCase() === sn)) {
      return t('shortCodeTaken', { code: sn })
    }
    return null
  }, [hotelForm.shortName, hotels, editHotelId, t])

  async function handleSubmitHotel(e: React.FormEvent) {
    e.preventDefault()

    // Auto-append anything typed in the field before submitting
    const finalForm = { ...hotelForm }
    const pendingCat = roomCategoryInput.trim()
    if (pendingCat && !finalForm.roomTypes.includes(pendingCat)) {
       finalForm.roomTypes.push(pendingCat)
    }

    if (!finalForm.name.trim() || !finalForm.shortName.trim() || shortNameError || slugError) return
    if (finalForm.roomTypes.length === 0) {
      showToast(t('addAtLeastOneCategory'), 'error')
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
        showToast(editHotelId ? t('hotelUpdated') : t('hotelAdded'), 'success')
        setHotelOpen(false)
        setEditHotelId(null)
        load()
      } else {
        showToast(data.error || t('saveHotelFailed'), 'error')
      }
    } finally {
      setSavingHotel(false)
    }
  }

  async function handleDeleteHotel(id: string) {
    const res = await fetch(`/api/hotels/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t('hotelDeleted'), 'success')
      setHotelDeleteConfirm(null)
      load()
    } else {
      showToast(t('deleteHotelFailed'), 'error')
    }
  }

  // ---- Room form ------------------------------------------------------------

  function openRoomModal() {
    if (hotels.length === 0) {
      showToast(t('addHotelFirst'), 'info')
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
        showToast(editRoomId ? t('roomUpdated') : t('roomAdded'), 'success')
        setRoomOpen(false)
        setEditRoomId(null)
        load()
      } else {
        showToast(data.error || t('saveRoomFailed'), 'error')
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
      showToast(t('saveRoomOrderFailed'), 'error')
    }
  }

  function handleRoomDrop(hotelId: string, floor: number) {
    setDraggingRoomId(null)
    persistRoomOrder(hotelId, floor)
  }

  async function handleDeleteRoom(id: string) {
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast(t('roomDeleted'), 'success')
      setRoomDeleteConfirm(null)
      load()
    } else {
      showToast(t('deleteRoomFailed'), 'error')
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
      showToast(t('roomAssigned'), 'success')
      load()
    } else {
      showToast(data.error || t('assignRoomFailed'), 'error')
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

  return {
    hotels, rooms, loading,
    // hotel modal
    hotelOpen, setHotelOpen, editHotelId, hotelForm, setHotelForm, savingHotel,
    hotelDeleteConfirm, setHotelDeleteConfirm, roomCategoryInput, setRoomCategoryInput,
    openHotelModal, openEditHotel, onHotelNameChange, onShortNameChange, shortNameError, onSlugChange, slugError,
    handleSubmitHotel, handleDeleteHotel,
    // room modal
    roomOpen, setRoomOpen, editRoomId, roomForm, setRoomForm, savingRoom,
    roomDeleteConfirm, setRoomDeleteConfirm, openRoomModal, openEditRoom, roomHotel, roomShort,
    handleSubmitRoom, handleDeleteRoom, assignRoomToHotel,
    // drag + derived
    draggingRoomId, setDraggingRoomId, handleRoomDragOver, handleRoomDrop,
    hotelById, roomsByHotel, unassignedRooms, hasAnyGroupedRooms,
  }
}

export type HotelsRoomsPageState = ReturnType<typeof useHotelsRoomsPage>
