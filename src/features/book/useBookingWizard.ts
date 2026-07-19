'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { nowUZ } from '@/lib/timezone'
import { getServices } from '@/lib/api/services'
import { getHotels } from '@/lib/api/hotels'
import { getBookings } from '@/lib/api/bookings'
import { getClients } from '@/lib/api/clients'
import { useCreateBookingMutation } from '@/hooks/useBookings'
import {
  Service, ServiceVariant, Room, Hotel, ClientGroup, Client, PricingPlan, PricingGroup, BookingType, DayBooking, MenuItem,
} from './types'
import { serviceAvailableToHotel, generateTimeSlots, slotEnd, toMin } from './utils'
import { hoursForDate } from '@/lib/serviceHours'

// Sentinel category value meaning "client has no group" — maps to `groupId=none`
// server-side. There's no configured pricing for it, so price/duration are manual.
export const UNGROUPED = 'none'

// One slide per concern. "hotel" is dropped from the sequence entirely when
// there's nothing to choose (single-hotel admins are auto-scoped).
const SLIDE_KEYS = ['hotel', 'service', 'plan', 'guest', 'datetime', 'review'] as const
export type SlideKey = typeof SLIDE_KEYS[number]

export function useBookingWizard({
  initialDate,
  initialTime,
  onClose,
}: {
  initialDate?: string
  initialTime?: string
  onClose: () => void
}) {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const createMutation = useCreateBookingMutation()

  const [slideIndex, setSlideIndex] = useState(0)

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
  const [date, setDate] = useState(initialDate || nowUZ().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(initialTime || '')
  const [dayBookings, setDayBookings] = useState<DayBooking[]>([])

  // Guest / room details
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [notes, setNotes] = useState('')
  // Optional food/order request (e.g. for a SPA & Pool event) + when it should be ready.
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuReadyTime, setMenuReadyTime] = useState('')
  const [persons, setPersons] = useState(1)
  const [paid, setPaid] = useState(false)
  // Deposit taken at booking time (0 = none). `paid` covers the full-payment case.
  const [amountPaid, setAmountPaid] = useState(0)

  // Client search (client booking type)
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<Client[]>([])

  // Add-client modal
  const [addClientModalOpen, setAddClientModalOpen] = useState(false)
  const [addClientForm, setAddClientForm] = useState({ name: '', phone: '', notes: '' })
  const [savingNewClient, setSavingNewClient] = useState(false)

  const { data: rawServices = [], isLoading: loadingServices } = useQuery({ queryKey: ['services'], queryFn: getServices })
  const { data: rms = [], isLoading: loadingRooms } = useQuery({ queryKey: ['rooms'], queryFn: () => fetch('/api/rooms').then(r => r.json()) })
  const { data: htls = [], isLoading: loadingHotels } = useQuery({ queryKey: ['hotels'], queryFn: getHotels })
  const { data: grps = [], isLoading: loadingGroups } = useQuery({ queryKey: ['client-groups'], queryFn: () => fetch('/api/client-groups').then(r => r.json()) })

  const services = useMemo(() => Array.isArray(rawServices) ? rawServices.filter((s: Service) => s.isActive) : [], [rawServices])
  const rooms = Array.isArray(rms) ? rms : []
  const hotels = Array.isArray(htls) ? htls : []
  const clientGroups = Array.isArray(grps) ? grps : []

  const initialLoading = loadingServices || loadingRooms || loadingHotels || loadingGroups

  useEffect(() => {
    if (hotels.length === 1 && !selectedHotelId) {
      setSelectedHotelId(hotels[0]._id)
    }
  }, [hotels, selectedHotelId])

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

  // The service's effective hours for the chosen date (per-weekday schedule /
  // blackout dates collapse to one open/close window, or "closed").
  const dayHours = selectedService ? hoursForDate(selectedService, date) : null
  const closedOnDate = !!dayHours?.closed
  // Opening window (minutes), how many whole hours fit, and the per-hour rate
  // derived from the selected row (a row priced for its own duration).
  const openMin = dayHours ? toMin(dayHours.open) : 0
  const closeMin = dayHours ? toMin(dayHours.close) : 0
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

  const timeSlots = selectedService && activePlan && dayHours && !closedOnDate
    ? generateTimeSlots(dayHours.open, dayHours.close, activePlan.duration)
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

  // Live preview of the menu/order total — mirrors the Telegram message's math
  // (src/lib/telegram.ts › MENU_SERVICE_FEE_RATE must stay in sync).
  const menuSubtotal = menuItems.reduce((sum, it) => sum + it.qty * it.price, 0)
  const menuServiceFee = Math.round(menuSubtotal * 0.1)
  const menuTotal = menuSubtotal + menuServiceFee

  // ── Slide navigation ──────────────────────────────────────────────────────

  // The hotel slide only exists when there's actually a choice to make, or while loading to show skeleton.
  const slides = useMemo<SlideKey[]>(
    () => SLIDE_KEYS.filter(k => k !== 'hotel' || initialLoading || hotels.length > 1),
    [hotels.length, initialLoading],
  )
  const currentSlide: SlideKey = slides[slideIndex] ?? 'service'

  const slideValid: Record<SlideKey, boolean> = {
    hotel: !!selectedHotelId,
    service: !!selectedService,
    plan: planReady,
    guest: guestReady,
    datetime: !!selectedSlot,
    review: canReview,
  }
  const canGoNext = currentSlide !== 'review' && slideValid[currentSlide]

  function goNext() {
    if (currentSlide === 'review' || !slideValid[currentSlide]) return
    setSlideIndex(i => Math.min(slides.length - 1, i + 1))
  }

  function goBack() {
    setSlideIndex(i => Math.max(0, i - 1))
  }

  // Jump back to an earlier, already-completed slide (e.g. from the progress dots).
  function goToSlide(key: SlideKey) {
    const idx = slides.indexOf(key)
    if (idx >= 0 && idx <= slideIndex) setSlideIndex(idx)
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function chooseHotel(id: string) {
    setSelectedHotelId(id)
    setSelectedService(null)
    resetPlan()
    setSlideIndex(i => Math.min(slides.length - 1, i + 1))
  }

  function chooseService(svc: Service) {
    setSelectedService(svc)
    resetPlan()
    setSlideIndex(i => Math.min(slides.length - 1, i + 1))
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
    setPaid(false)
    setAmountPaid(0)
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

  // ── Menu / order items ───────────────────────────────────────────────────

  function addMenuItem() {
    setMenuItems(items => [...items, { name: '', qty: 1, price: 0 }])
  }

  function updateMenuItem(index: number, patch: Partial<MenuItem>) {
    setMenuItems(items => items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function removeMenuItem(index: number) {
    setMenuItems(items => items.filter((_, i) => i !== index))
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

  async function confirmBooking() {
    if (!selectedService || !selectedSlot || !date || !activePlan) return
    // Room bookings without an explicit name fall back to the room label.
    const finalName = customerName.trim() || (bookingType === 'room' ? roomNumber : t('guest'))

    try {
      const endTime = slotEnd(selectedSlot, activePlan.duration)
      await createMutation.mutateAsync({
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
        menuItems: menuItems.filter(it => it.name.trim()).map(it => ({ ...it, name: it.name.trim() })),
        menuReadyTime,
        paid: activePlan.price === 0 ? false : paid,
        amountPaid: activePlan.price === 0 ? 0 : (paid ? activePlan.price : Math.min(amountPaid, activePlan.price)),
        bookingType,
        category: selectedCategory,
        variantId: selectedVariant?.id,
      })
      showToast(t('bookingCreated'), 'success')
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      showToast(msg || t('createBookingFailed'), 'error')
    }
  }

  return {
    onClose,
    // collections
    hotels, clientGroups,
    // wizard position
    slides, slideIndex, currentSlide, canGoNext, goNext, goBack, goToSlide, canReview,
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
    date, setDate, selectedSlot, setSelectedSlot, dayBookings, availableSlots, closedOnDate,
    // guest / room
    selectedClientId, setSelectedClientId, selectedRoomId,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    roomNumber, setRoomNumber, notes, setNotes,
    menuItems, addMenuItem, updateMenuItem, removeMenuItem, menuReadyTime, setMenuReadyTime,
    menuSubtotal, menuServiceFee, menuTotal,
    persons, setPersons, paid, setPaid,
    amountPaid, setAmountPaid, loading: createMutation.isPending,
    clientSearch, setClientSearch, clientResults, clearClient,
    // add-client modal
    addClientModalOpen, addClientForm, setAddClientForm, savingNewClient,
    openAddClientModal, closeAddClientModal, submitAddClient,
    // derived
    hotelServices, clientCats, roomCats, planRows, activePlan,
    categoryMeta, categoryRooms, timeSlots, customValid, planReady, guestReady,
    initialLoading,
    // helpers
    resolveGroupMeta, roomLabel,
    // actions
    chooseService, chooseType, chooseCategory,
    pickClient, pickRoom, confirmBooking,
  }
}

export type BookingWizard = ReturnType<typeof useBookingWizard>
