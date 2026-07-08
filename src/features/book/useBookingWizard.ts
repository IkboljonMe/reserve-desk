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
  Service, Room, Hotel, ClientGroup, Client, PricingPlan, PricingGroup, BookingType, DayBooking,
} from './types'
import { serviceAvailableToHotel, extractHotelId, generateTimeSlots, slotEnd } from './utils'

export function useBookingWizard() {
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, lang } = useTranslation()

  const [services, setServices] = useState<Service[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])

  const [step, setStep] = useState(1)
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Plan step
  const [bookingType, setBookingType] = useState<BookingType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('') // client group _id OR room type
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [customDuration, setCustomDuration] = useState(60)
  const [customPrice, setCustomPrice] = useState(0)

  // When step
  const [date, setDate] = useState(searchParams.get('date') || nowUZ().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState(searchParams.get('time') || '')
  const [dayBookings, setDayBookings] = useState<DayBooking[]>([])

  // Confirm step
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [paid, setPaid] = useState(false)
  const [loading, setLoading] = useState(false)

  // Client search (client booking type)
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<Client[]>([])

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
          setStep(3)
        }
      } else if (htlList.length === 1) {
        // Admins are scoped to a single hotel — skip the hotel-picker step.
        setSelectedHotelId(htlList[0]._id)
        setStep(2)
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

  // Search clients within the chosen group (client booking type)
  useEffect(() => {
    if (step !== 5 || bookingType !== 'client' || !selectedCategory) return
    const timer = setTimeout(async () => {
      try {
        const data = await getClients(selectedCategory, clientSearch.trim())
        setClientResults(Array.isArray(data) ? data : [])
      } catch {
        setClientResults([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [step, bookingType, selectedCategory, clientSearch])

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

  // Category groups available for the current service, filtered to still-valid ones.
  const clientCats = (selectedService?.pricingGroups ?? [])
    .filter(g => g.target === 'client' && g.rows.length > 0 && clientGroups.some(c => c._id === g.category))
  const roomCats = (selectedService?.pricingGroups ?? [])
    .filter(g => g.target === 'room' && g.rows.length > 0)

  const activeGroup = bookingType === 'client'
    ? clientCats.find(g => g.category === selectedCategory)
    : bookingType === 'room'
      ? roomCats.find(g => g.category === selectedCategory)
      : undefined
  const planRows = activeGroup?.rows ?? []

  const activePlan: PricingPlan | null = bookingType === 'custom'
    ? { duration: customDuration, price: customPrice }
    : selectedPlan

  const categoryMeta = activeGroup ? resolveGroupMeta(activeGroup) : null

  // Rooms of the chosen category in the selected hotel (room booking type)
  const categoryRooms = rooms.filter(r => r.hotelId === selectedHotelId && (r.type || '') === selectedCategory)

  const roomLabel = (r: Room) => `${hotels.find(h => h._id === r.hotelId)?.shortName || '??'}-${r.number}`

  const timeSlots = selectedService && activePlan
    ? generateTimeSlots(selectedService.openTime, selectedService.closeTime, activePlan.duration)
    : []

  const customValid = customDuration >= 15 && customDuration % 15 === 0
  const planReady = bookingType === 'custom' ? customValid : !!(selectedCategory && selectedPlan)

  // ── Actions ────────────────────────────────────────────────────────────────

  function chooseHotel(id: string) {
    setSelectedHotelId(id)
    setSelectedService(null)
    resetPlan()
    setStep(2)
  }

  function chooseService(svc: Service) {
    setSelectedService(svc)
    resetPlan()
    setStep(3)
  }

  function resetPlan() {
    setBookingType(null)
    setSelectedCategory('')
    setSelectedPlan(null)
    setSelectedSlot('')
    setCustomDuration(selectedService?.slotDuration || 60)
    setCustomPrice(selectedService?.isFree ? 0 : (selectedService?.price || 0))
    resetGuest()
  }

  function chooseType(type: BookingType) {
    setBookingType(type)
    setSelectedCategory('')
    setSelectedPlan(null)
    setSelectedSlot('')
    if (type === 'custom') {
      setCustomDuration(selectedService?.slotDuration || 60)
      setCustomPrice(selectedService?.isFree ? 0 : (selectedService?.price || 0))
    }
  }

  function chooseCategory(cat: string) {
    setSelectedCategory(cat)
    setSelectedPlan(null)
    setSelectedSlot('')
  }

  function resetGuest() {
    setSelectedClientId(null)
    setSelectedRoomId('')
    setCustomerName('')
    setCustomerPhone('')
    setRoomNumber('')
    setClientSearch('')
    setClientResults([])
  }

  function pickClient(c: Client) {
    setSelectedClientId(c._id)
    setCustomerName(c.name)
    setCustomerPhone(c.phone || '')
    if (c.roomNumber) setRoomNumber(c.roomNumber)
  }

  function pickRoom(r: Room) {
    setSelectedRoomId(r._id)
    setRoomNumber(roomLabel(r))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService || !selectedSlot || !customerName.trim() || !date || !activePlan) return

    setLoading(true)
    try {
      const endTime = slotEnd(selectedSlot, activePlan.duration)
      await createBooking({
        serviceId: selectedService._id,
        clientId: selectedClientId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        roomNumber: roomNumber.trim(),
        date,
        startTime: selectedSlot,
        endTime,
        duration: activePlan.duration,
        totalPrice: activePlan.price,
        notes: notes.trim(),
        paid: activePlan.price === 0 ? false : paid,
        bookingType,
        category: selectedCategory,
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
    step, setStep,
    selectedHotelId, selectedService,
    // plan
    bookingType, selectedCategory, selectedPlan, setSelectedPlan,
    customDuration, setCustomDuration, customPrice, setCustomPrice,
    // when
    date, setDate, selectedSlot, setSelectedSlot, dayBookings,
    // confirm
    selectedClientId, setSelectedClientId, selectedRoomId,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    roomNumber, setRoomNumber, notes, setNotes, paid, setPaid, loading,
    clientSearch, setClientSearch, clientResults,
    // derived
    hotelServices, clientCats, roomCats, planRows, activePlan,
    categoryMeta, categoryRooms, timeSlots, customValid, planReady,
    // helpers
    resolveGroupMeta, roomLabel,
    // actions
    chooseHotel, chooseService, chooseType, chooseCategory,
    pickClient, pickRoom, handleSubmit,
  }
}

export type BookingWizard = ReturnType<typeof useBookingWizard>
