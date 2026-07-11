'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth,
  parseISO, addMonths, subMonths,
} from 'date-fns'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { svcId, extractHotelId, bookingState, amountCollected } from '@/lib/bookingHelpers'
import { Booking } from '@/types'
import { useServicesQuery } from '@/hooks/useServices'
import { useHotelsQuery } from '@/hooks/useHotels'
import { useBookingsQuery, useUpdateBookingMutation, useDeleteBookingMutation } from '@/hooks/useBookings'
import { ViewMode, StatusFilter, Density, ROW_HEIGHTS } from './constants'

export function useCalendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { lang, t } = useTranslation()

  const [today, setToday] = useState(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = searchParams.get('date')
    return d ? parseISO(d) : new Date()
  })
  const [view, setView] = useState<ViewMode>('week')
  const [density, setDensity] = useState<Density>('Cozy')
  const { data: services = [] } = useServicesQuery()
  const { data: hotels = [] } = useHotelsQuery()
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set())

  const getDateRange = useCallback(() => {
    if (view === 'day') {
      const d = format(currentDate, 'yyyy-MM-dd')
      return { from: d, to: d }
    }
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return { from: format(start, 'yyyy-MM-dd'), to: format(addDays(start, 6), 'yyyy-MM-dd') }
    }
    return { from: format(startOfMonth(currentDate), 'yyyy-MM-dd'), to: format(endOfMonth(currentDate), 'yyyy-MM-dd') }
  }, [view, currentDate])

  const { from: dateFrom, to: dateTo } = useMemo(() => getDateRange(), [getDateRange])
  const { data: bookings = [], isLoading: loadingBookings } = useBookingsQuery(dateFrom, dateTo)

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [payConfirm, setPayConfirm] = useState<Booking | null>(null)
  const [editBooking, setEditBooking] = useState<Booking | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const rowH = ROW_HEIGHTS[density]

  // Map each service to its hotel (services are populated with hotelId).
  const serviceHotel = useMemo(() => {
    const m = new Map<string, string>()
    services.forEach(s => m.set(s._id, extractHotelId(s.hotelId)))
    return m
  }, [services])

  // Keep "now" fresh for the current-time indicator
  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Initialize selections once data is loaded (one-shot seeding, hence the
  // intentionally narrow deps and the set-state-in-effect suppressions).
  useEffect(() => {
    if (services.length > 0 && selectedServices.size === 0) {
      const active = services.filter(s => s.isActive)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedServices(new Set(active.map(s => s._id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services])

  useEffect(() => {
    if (hotels.length > 0 && selectedHotels.size === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedHotels(new Set(hotels.map(h => h._id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels])

  const navigate = (dir: -1 | 1) => {
    if (view === 'day') setCurrentDate(d => addDays(d, dir))
    else if (view === 'week') setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    else setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
  }

  const knownHotelIds = useMemo(() => new Set(hotels.map(h => h._id)), [hotels])

  // Apply all filters
  const visibleBookings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter(b => {
      if (!b.serviceId) return false
      if (b.status === 'cancelled') return false
      if (!selectedServices.has(svcId(b))) return false
      // Only apply the hotel filter to hotels the viewer can actually filter by.
      // A shared service is owned by a hotel that may not be in this viewer's
      // pill list; its bookings (incl. masked occupancy) should still show.
      const hid = serviceHotel.get(svcId(b)) || ''
      if (hid && knownHotelIds.has(hid) && !selectedHotels.has(hid)) return false
      if (statusFilter !== 'all') {
        const st = bookingState(b).key
        if (statusFilter === 'unpaid' && st !== 'unpaid' && st !== 'partial') return false
        if (statusFilter === 'paid' && !(st === 'paid' || st === 'free')) return false
        if (statusFilter === 'finished' && st !== 'finished') return false
      }
      if (q) {
        const hay = `${b.customerName} ${b.roomNumber} ${b.customerPhone}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [bookings, selectedServices, selectedHotels, serviceHotel, knownHotelIds, statusFilter, search])

  const bookingsForDay = useCallback(
    (dateStr: string) => visibleBookings.filter(b => b.date === dateStr),
    [visibleBookings],
  )

  // Summary of the visible range
  const summary = useMemo(() => {
    const own = visibleBookings.filter(b => !b.masked)
    const count = own.length
    const revenue = own.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    const collected = own.reduce((sum, b) => sum + amountCollected(b), 0)
    return { count, revenue, collected }
  }, [visibleBookings])

  const updateMutation = useUpdateBookingMutation()
  const deleteMutation = useDeleteBookingMutation()

  async function updateBooking(id: string, changes: Partial<Booking>, successMsg: string) {
    try {
      const payload: Record<string, unknown> = { ...changes }
      if (changes.serviceId && typeof changes.serviceId === 'object') {
        payload.serviceId = changes.serviceId._id
      }
      await updateMutation.mutateAsync({ id, data: payload })
      setSelectedBooking(prev => (prev && prev._id === id ? { ...prev, ...changes } : prev))
      showToast(successMsg, 'success')
    } catch {
      showToast(t('updateFailed'), 'error')
    }
  }

  const markPaid = (b: Booking) =>
    updateBooking(b._id, { paid: true, amountPaid: b.totalPrice || 0 }, t('markedAsPaid'))
  // Record a (possibly partial) collected total for a booking. `amount` is the
  // new cumulative amountPaid; paid flips true once it covers the total.
  const recordPayment = (b: Booking, amount: number) => {
    const total = b.totalPrice || 0
    const amt = Math.max(0, Math.min(total, amount))
    const fully = total > 0 && amt >= total
    return updateBooking(b._id, { amountPaid: amt, paid: fully }, fully ? t('markedAsPaid') : t('paymentRecorded'))
  }
  const markFinished = (b: Booking) => updateBooking(b._id, { finished: true }, t('bookingCompleted'))

  // Save an edit / reschedule. Surfaces the server's conflict message (e.g. a
  // 409 "fully booked") rather than a generic failure so the user can react.
  async function saveBookingEdit(id: string, changes: Partial<Booking>) {
    try {
      await updateMutation.mutateAsync({ id, data: changes })
      setSelectedBooking(prev => (prev && prev._id === id ? { ...prev, ...changes } : prev))
      setEditBooking(null)
      showToast(t('bookingUpdated'), 'success')
    } catch (e) {
      showToast(e instanceof Error && e.message ? e.message : t('updateFailed'), 'error')
    }
  }

  async function handleDeleteBooking(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      showToast(t('bookingDeleted'), 'success')
      setSelectedBooking(null)
      setDeleteConfirm(null)
    } catch {
      showToast(t('deleteFailed'), 'error')
    }
  }

  const goToCreate = (dateStr: string, time?: string) =>
    router.push(`/${lang}/book?date=${dateStr}${time ? `&time=${time}` : ''}`)

  const headerLabel = view === 'day'
    ? format(currentDate, 'EEEE, MMMM d, yyyy')
    : view === 'week'
      ? (() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(start, 'MMM d')} – ${format(addDays(start, 6), 'MMM d, yyyy')}`
      })()
      : format(currentDate, 'MMMM yyyy')

  const allSelected = services.length > 0 && selectedServices.size === services.length
  const allHotelsSelected = hotels.length > 0 && selectedHotels.size === hotels.length

  return {
    today, currentDate, setCurrentDate, view, setView, density, setDensity,
    services, hotels, selectedServices, setSelectedServices, selectedHotels, setSelectedHotels,
    bookings, loadingBookings, selectedBooking, setSelectedBooking,
    deleteConfirm, setDeleteConfirm, payConfirm, setPayConfirm,
    editBooking, setEditBooking, saveBookingEdit,
    search, setSearch, statusFilter, setStatusFilter, rowH, serviceHotel,
    navigate, visibleBookings, bookingsForDay, summary,
    markPaid, recordPayment, markFinished, handleDeleteBooking, goToCreate,
    headerLabel, allSelected, allHotelsSelected,
  }
}

export type CalendarPageState = ReturnType<typeof useCalendarPage>
