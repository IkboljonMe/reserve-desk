'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/i18n'
import { nowUZ } from '@/lib/timezone'
import { getServices } from '@/lib/api/services'
import { getHotels } from '@/lib/api/hotels'
import { getBookings, createBooking } from '@/lib/api/bookings'
import { getClients } from '@/lib/api/clients'
import {
  Service, ServiceVariant, Room, Hotel, ClientGroup, Client, PricingPlan, PricingGroup, BookingType, DayBooking,
} from './types'
import { serviceAvailableToHotel, extractHotelId, generateTimeSlots, slotEnd, toMin } from './utils'

// Sentinel category value meaning "client has no group" — maps to `groupId=none`
// server-side. There's no configured pricing for it, so price/duration are manual.
export const UNGROUPED = 'none'

export function useBookingWizard() {
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, lang } = useTranslation()

  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])

  // Only two macro steps: 1 = select everything, 2 = review & confirm.
  const [step, setStep] = useState(1)

  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  // Chosen configuration of the service (e.g. "Half pool"). null when the
  // service has no variants — pricing then comes from the service itself.
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null)

  // Plan section
  const [bookingType, setBookingType] = useState<BookingType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('') // client group _id, UNGROUPED, or room type
  // A configured pricing row, read as an hourly rate. The guest then picks how
  // many hours (or the whole day) and the total is computed from the rate.
  const [selectedRate, setSelectedRate] = useState<PricingPlan | null>(null)
  const [selectedHours, setSelectedHours] = useState(1)
  const [wholeDay, setWholeDay] = useState(false)
  const [customDuration, setCustomDuration] = useState(60)
  const [customPrice, setCustomPrice] = useState(0)

  // Date & time
  const [date, setDate] = useState(searchParams.get('date') || nowUZ().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(searchParams.get('time') || '')
  const [dayBookings, setDayBookings] = useState<DayBooking[]>([])

  // Guest / room details
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [persons, setPersons] = useState(1)
  const [paid, setPaid] = useState(false)
  const [loading, setLoading] = useState(false)

  // Client search (client booking type)
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<Client[]>([])

  // Add-client modal
  const [addClientModalOpen, setAddClientModalOpen] = useState(false)
  const [addClientForm, setAddClientForm] = useState({ name: '', phone: '', notes: '' })
  const [savingNewClient, setSavingNewClient] = useState(false)

  const preServiceId = searchParams.get('serviceId')

  useEffect(() => {
    Promise.all([
      getServices(),
      fetch('/api/rooms').then(r => r.json()),
      getHotels(),
      fetch('/api/client-groups').then(r => r.json()),
    ]).then(([svcs, rms, htls, grps]) => {
      const active = Array.isArray(svcs) ? svcs.filter((s: Service) => s.isActive) : []
      setServices(active)
      setRooms(Array.isArray(rms) ? rms : [])
      setHotels(Array.isArray(htls) ? htls : [])
      setClientGroups(Array.isArray(grps) ? grps : [])
      const htlList = Array.isArray(htls) ? htls : []
      if (preServiceId) {
        const found = active.find((s: Service) => s._id === preServiceId)
        if (found) {
          const hid = extractHotelId(found.hotelId)
          if (hid) setSelectedHotelId(hid)
          setSelectedService(found)
        }
      } else if (htlList.length === 1) {
        // Admins are scoped to a single hotel — auto-select, no picker shown.
        setSelectedHotelId(htlList[0]._id)
      }
    })
  }, [preServiceId])

  // Load existing bookings for the day (for slot availability)
  useEffect(() => {
    if (!selectedService || !date) return
    getBookings(date, date)
      .then(data => {
        type BookingRow = DayBooking & { serviceId: string | { _id: string } }
        const filtered = Array.isArray(data)
          ? (data as BookingRow[]).filter(b => b.status !== 'cancelled' && (typeof b.serviceId === 'string' ? b.serviceId : b.serviceId?._id) === selectedService._id)
          : []
        setDayBookings(filtered)
      })
  }, [selectedService, date])

  // Search clients within the chosen group (client booking type), including "ungrouped".
  useEffect(() => {
    if (bookingType !== 'client' || !selectedCategory) return
    const timer = setTimeout(async () => {
      try {
        const data = await getClients(selectedCategory, clientSearch.trim())
        setClientResults(Array.isArray(data) ? data : [])
      } catch {
        setClientResults([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [bookingType, selectedCategory, clientSearch])

  // ── Derived ────────────────────────────────────────────────────────────────

  const hotelServices = selectedHotelId
    ? services.filter(s => serviceAvailableToHotel(s, selectedHotelId))
    : []

  function resolveGroupMeta(g: PricingGroup): { label: string; color: string } {
    if (g.target === 'client') {
      const cg = clientGroups.find(c => c._id === g.category)
      return { label: cg?.name ?? t('unknownGroup'), color: cg?.color ?? 'var(--gray-500)' }
    }
    return { label: g.category, color: selectedService?.color ?? 'var(--brand-500)' }
  }

  // Does the chosen service offer variants the guest must pick from first?
  const hasVariants = (selectedService?.variants?.length ?? 0) > 0

  // Pricing comes from the selected variant when the service has variants,
  // otherwise straight from the service.
  const pricingSource: { pricingGroups?: PricingGroup[] } | null = hasVariants ? selectedVariant : selectedService

  // Category groups available for the current pricing source, filtered to still-valid ones.
  const clientCats = (pricingSource?.pricingGroups ?? [])
    .filter(g => g.target === 'client' && g.rows.length > 0 && clientGroups.some(c => c._id === g.category))
  const roomCats = (pricingSource?.pricingGroups ?? [])
    .filter(g => g.target === 'room' && g.rows.length > 0)

  // "Ungrouped" (shown to the guest as "Custom") clients have no configured
  // pricing group, so duration/price are entered manually.
  const isUngroupedClient = bookingType === 'client' && selectedCategory === UNGROUPED
  const usingManualPrice = isUngroupedClient

  const activeGroup = bookingType === 'client'
    ? clientCats.find(g => g.category === selectedCategory)
    : bookingType === 'room'
      ? roomCats.find(g => g.category === selectedCategory)
      : undefined
  const planRows = activeGroup?.rows ?? []

  // Opening window (minutes), how many whole hours fit, and the per-hour rate
  // derived from the selected row (a row priced for its own duration).
  const openMin = selectedService ? toMin(selectedService.openTime) : 0
  const closeMin = selectedService ? toMin(selectedService.closeTime) : 0
  const dayMinutes = Math.max(0, closeMin - openMin)
  const maxHours = Math.max(1, Math.floor(dayMinutes / 60))
  const ratePerHour = selectedRate ? Math.round(selectedRate.price / Math.max(1, selectedRate.duration / 60)) : 0

  // The effective duration + total price. Manual (ungrouped) keeps the typed
  // values; otherwise total = rate × chosen hours (or the whole open→close day).
  const activePlan: PricingPlan | null = usingManualPrice
    ? { duration: customDuration, price: customPrice }
    : selectedRate
      ? (wholeDay
          ? { duration: dayMinutes, price: Math.round(ratePerHour * (dayMinutes / 60)) }
          : { duration: selectedHours * 60, price: ratePerHour * selectedHours })
      : null

  const categoryMeta = isUngroupedClient
    ? { label: t('typeCustom'), color: 'var(--gray-400)' }
    : activeGroup ? resolveGroupMeta(activeGroup) : null

  // Rooms of the chosen category in the selected hotel (room booking type)
  const categoryRooms = rooms.filter(r => r.hotelId === selectedHotelId && (r.type || '') === selectedCategory)

  const roomLabel = (r: Room) => `${hotels.find(h => h._id === r.hotelId)?.shortName || '??'}-${r.number}`

  const timeSlots = selectedService && activePlan
    ? generateTimeSlots(selectedService.openTime, selectedService.closeTime, activePlan.duration)
    : []

  // Only the start times where the whole booking fits without colliding with an
  // existing booking. The candidate reserves [start-bufferBefore, end+bufferAfter]
  // and must not overlap any existing booking's [start, end] for this service.
  const bufBefore = selectedService?.bufferTimeBefore || 0
  const bufAfter = selectedService?.bufferTimeAfter || 0
  // A service can host up to `capacity` concurrent bookings; a start is offered
  // while fewer than `capacity` existing bookings overlap the candidate window.
  const capacity = selectedService?.capacity || 1
  const availableSlots = activePlan
    ? timeSlots.filter(slot => {
        const start = toMin(slot)
        const end = start + activePlan.duration
        const overlaps = dayBookings.filter(b => toMin(b.startTime) < end + bufAfter && toMin(b.endTime) > start - bufBefore).length
        return overlaps < capacity
      })
    : []

  const customValid = customDuration >= 15 && customDuration % 15 === 0
  const planReady = (!hasVariants || !!selectedVariant) &&
    (usingManualPrice ? customValid : !!(selectedCategory && selectedRate))

  // Whether guest/room details satisfy what's needed to move to review.
  // Client: needs a name (picked or typed). Room: needs a specific room picked.
  const guestReady = bookingType === 'client'
    ? !!customerName.trim()
    : !!selectedRoomId

  const canReview = !!(selectedService && activePlan && selectedSlot && date && planReady && guestReady)

  // ── Actions ────────────────────────────────────────────────────────────────

  function chooseHotel(id: string) {
    setSelectedHotelId(id)
    setSelectedService(null)
    resetPlan()
  }

  function chooseService(svc: Service) {
    setSelectedService(svc)
    resetPlan()
  }

  function resetPlan() {
    setSelectedVariant(null)
    setBookingType(null)
    setSelectedCategory('')
    setSelectedRate(null)
    setSelectedHours(1)
    setWholeDay(false)
    setSelectedSlot('')
    setCustomDuration(selectedService?.slotDuration || 60)
    setCustomPrice(selectedService?.isFree ? 0 : (selectedService?.price || 0))
    resetGuest()
  }

  // Pick a service variant, then reset the pricing choices below it.
  function chooseVariant(v: ServiceVariant) {
    setSelectedVariant(v)
    setBookingType(null)
    setSelectedCategory('')
    setSelectedRate(null)
    setSelectedHours(1)
    setWholeDay(false)
    setSelectedSlot('')
    resetGuest()
  }

  function chooseType(type: BookingType) {
    setBookingType(type)
    setSelectedCategory('')
    setSelectedRate(null)
    setSelectedHours(1)
    setWholeDay(false)
    setSelectedSlot('')
    resetGuest()
  }

  function chooseCategory(cat: string) {
    setSelectedCategory(cat)
    setSelectedRate(null)
    setSelectedHours(1)
    setWholeDay(false)
    setSelectedSlot('')
    if (cat === UNGROUPED) {
      setCustomDuration(selectedService?.slotDuration || 60)
      setCustomPrice(selectedService?.isFree ? 0 : (selectedService?.price || 0))
    }
    resetGuest()
  }

  // Pick a rate (hourly), then how many hours — defaulting to 1 hour.
  function chooseRate(rate: PricingPlan) {
    setSelectedRate(rate)
    setSelectedHours(1)
    setWholeDay(false)
    setSelectedSlot('')
  }

  function chooseHours(n: number) {
    setSelectedHours(n)
    setWholeDay(false)
    setSelectedSlot('')
  }

  function chooseWholeDay() {
    setWholeDay(true)
    setSelectedSlot('')
  }

  function resetGuest() {
    setSelectedClientId(null)
    setSelectedRoomId('')
    setCustomerName('')
    setCustomerPhone('')
    setRoomNumber('')
    setPersons(1)
    setClientSearch('')
    setClientResults([])
  }

  function pickClient(c: Client) {
    setSelectedClientId(c._id)
    setCustomerName(c.name)
    setCustomerPhone(c.phone || '')
    if (c.roomNumber) setRoomNumber(c.roomNumber)
  }

  function clearClient() {
    setSelectedClientId(null)
    setCustomerName('')
    setCustomerPhone('')
    setRoomNumber('')
    setClientSearch('')
  }

  function pickRoom(r: Room) {
    setSelectedRoomId(r._id)
    setRoomNumber(roomLabel(r))
  }

  // ── Add-client modal ─────────────────────────────────────────────────────

  function openAddClientModal() {
    setAddClientForm({ name: clientSearch.trim(), phone: '', notes: '' })
    setAddClientModalOpen(true)
  }

  function closeAddClientModal() {
    setAddClientModalOpen(false)
    setAddClientForm({ name: '', phone: '', notes: '' })
  }

  async function submitAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!addClientForm.name.trim()) return
    setSavingNewClient(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addClientForm.name.trim(),
          phone: addClientForm.phone.trim(),
          notes: addClientForm.notes.trim(),
          groupId: selectedCategory === UNGROUPED ? null : selectedCategory,
        }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      pickClient(created)
      setClientResults(prev => [created, ...prev])
      showToast(t('clientAdded'), 'success')
      closeAddClientModal()
    } catch {
      showToast(t('saveClientFailed'), 'error')
    } finally {
      setSavingNewClient(false)
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function goToReview() {
    if (!canReview) return
    setStep(2)
  }

  async function confirmBooking() {
    if (!selectedService || !selectedSlot || !date || !activePlan) return
    // Room bookings without an explicit name fall back to the room label.
    const finalName = customerName.trim() || (bookingType === 'room' ? roomNumber : t('guest'))

    setLoading(true)
    try {
      const endTime = slotEnd(selectedSlot, activePlan.duration)
      await createBooking({
        serviceId: selectedService._id,
        clientId: selectedClientId,
        customerName: finalName,
        customerPhone: customerPhone.trim(),
        roomNumber: roomNumber.trim(),
        date,
        startTime: selectedSlot,
        endTime,
        duration: activePlan.duration,
        persons,
        totalPrice: activePlan.price,
        notes: notes.trim(),
        paid: activePlan.price === 0 ? false : paid,
        bookingType,
        category: selectedCategory,
        variantId: selectedVariant?.id,
      })
      showToast(t('bookingCreated'), 'success')
      router.push(`/${lang}/calendar?date=${date}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      showToast(msg || t('createBookingFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return {
    router,
    // collections
    hotels, clientGroups,
    // wizard position
    step, setStep, goToReview, canReview,
    selectedHotelId, selectedService, chooseHotel,
    // variant
    selectedVariant, hasVariants, chooseVariant,
    // plan
    bookingType, selectedCategory,
    selectedRate, chooseRate, selectedHours, chooseHours, wholeDay, chooseWholeDay,
    ratePerHour, maxHours,
    customDuration, setCustomDuration, customPrice, setCustomPrice,
    isUngroupedClient, usingManualPrice,
    // when
    date, setDate, selectedSlot, setSelectedSlot, dayBookings, availableSlots,
    // guest / room
    selectedClientId, setSelectedClientId, selectedRoomId,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    roomNumber, setRoomNumber, notes, setNotes, persons, setPersons, paid, setPaid, loading,
    clientSearch, setClientSearch, clientResults, clearClient,
    // add-client modal
    addClientModalOpen, addClientForm, setAddClientForm, savingNewClient,
    openAddClientModal, closeAddClientModal, submitAddClient,
    // derived
    hotelServices, clientCats, roomCats, planRows, activePlan,
    categoryMeta, categoryRooms, timeSlots, customValid, planReady, guestReady,
    // helpers
    resolveGroupMeta, roomLabel,
    // actions
    chooseService, chooseType, chooseCategory,
    pickClient, pickRoom, confirmBooking,
  }
}

export type BookingWizard = ReturnType<typeof useBookingWizard>
