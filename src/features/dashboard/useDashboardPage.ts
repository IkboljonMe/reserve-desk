'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, parseISO, eachDayOfInterval, eachWeekOfInterval, addDays, subDays, differenceInCalendarDays,
} from 'date-fns'
import { nowUZ } from '@/lib/timezone'
import { dateLocale } from '@/lib/dateLocale'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { svcId, extractHotelId, bookingState, amountCollected, toMin } from '@/lib/bookingHelpers'
import { hoursForDate, weekdayOf } from '@/lib/serviceHours'
import { useQueryClient } from '@tanstack/react-query'
import { Booking } from '@/types'
import { useServicesQuery } from '@/hooks/useServices'
import { useHotelsQuery } from '@/hooks/useHotels'
import { useBookingsQuery } from '@/hooks/useBookings'
import * as XLSX from 'xlsx'
import { periodRange, PaymentFilter, TypeFilter, StateFilter, PeriodKey, SortKey } from './utils'

export function useDashboardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { t, lang } = useTranslation()
  const locale = dateLocale(lang)

  const { data: servicesRaw = [] } = useServicesQuery()
  const { data: hotels = [] } = useHotelsQuery()
  const services = useMemo(() => servicesRaw.filter(s => s.isActive), [servicesRaw])

  // Period
  const [period, setPeriod] = useState<PeriodKey>('week')
  const [customFrom, setCustomFrom] = useState(format(subDays(nowUZ(), 29), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(nowUZ(), 'yyyy-MM-dd'))
  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo])

  const { data: bookingsRaw = [], isLoading: loading } = useBookingsQuery(range.from, range.to)
  // Exclude cancelled and masked (other hotels' bookings on a shared service —
  // they're attributed elsewhere and carry no visible data for this hotel).
  const bookings = useMemo(() => bookingsRaw.filter(b => b.status !== 'cancelled' && !b.masked), [bookingsRaw])

  // Explorer filters
  const [search, setSearch] = useState('')
  const [fHotels, setFHotels] = useState<Set<string>>(new Set())
  const [fServices, setFServices] = useState<Set<string>>(new Set())
  const [fPayment, setFPayment] = useState<PaymentFilter>('all')
  const [fType, setFType] = useState<TypeFilter>('all')
  const [fState, setFState] = useState<StateFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Detail drawer
  const [detailId, setDetailId] = useState<string | null>(null)

  const serviceHotel = useMemo(() => {
    const m = new Map<string, string>()
    services.forEach(s => m.set(s._id, extractHotelId(s.hotelId)))
    return m
  }, [services])

  const queryClient = useQueryClient()

  // Optimistic local patch after a mutation.
  const patchLocal = useCallback((id: string, changes: Partial<Booking>) => {
    queryClient.setQueriesData({ queryKey: ['bookings'] }, (old: unknown) => {
      if (!Array.isArray(old)) return old
      return old.map(b => (b._id === id ? { ...b, ...changes } : b))
    })
  }, [queryClient])

  const handleDeleted = useCallback((id: string) => {
    queryClient.setQueriesData({ queryKey: ['bookings'] }, (old: unknown) => {
      if (!Array.isArray(old)) return old
      return old.filter(b => b._id !== id)
    })
    setDetailId(null)
  }, [queryClient])

  // ── Filtered + sorted rows ──────────────────────────────────────────────────
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = bookings.filter(b => {
      if (!b.serviceId) return false
      if (fServices.size && !fServices.has(svcId(b))) return false
      const hid = serviceHotel.get(svcId(b)) || ''
      if (fHotels.size && !(hid && fHotels.has(hid))) return false
      const st = bookingState(b).key
      if (fPayment === 'paid' && st !== 'paid') return false
      if (fPayment === 'unpaid' && st !== 'unpaid' && st !== 'partial') return false
      if (fPayment === 'free' && st !== 'free') return false
      if (fType !== 'all' && (b.bookingType || 'custom') !== fType) return false
      if (fState === 'active' && b.finished) return false
      if (fState === 'finished' && !b.finished) return false
      if (q && !`${b.customerName} ${b.roomNumber} ${b.customerPhone}`.toLowerCase().includes(q)) return false
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      if (sortKey === 'price') return (a.totalPrice - b.totalPrice) * dir
      if (sortKey === 'created') return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * dir
      const ad = `${a.date} ${a.startTime}`, bd = `${b.date} ${b.startTime}`
      return ad < bd ? -dir : ad > bd ? dir : 0
    })
  }, [bookings, search, fServices, fHotels, fPayment, fType, fState, serviceHotel, sortKey, sortDir])

  function exportToExcel() {
    if (rows.length === 0) {
      showToast(t('noDataToExport'), 'error')
      return
    }

    const data = rows.map((b, index) => {
      const hotel = hotels.find(h => h._id === serviceHotel.get(svcId(b)))
      const st = bookingState(b)
      return {
        '#': index + 1,
        'Guest Name': b.customerName,
        'Phone': b.customerPhone,
        'Hotel': hotel?.name || '—',
        'Room': b.roomNumber || '—',
        'Service': b.serviceId?.name || '—',
        'Date': b.date,
        'Time': `${b.startTime} - ${b.endTime}`,
        'Price': b.totalPrice,
        'Status': st.label,
        'Notes': b.notes || '',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(data)

    // Auto-fit column widths
    const maxLens = Object.keys(data[0] || {}).reduce((acc: Record<string, number>, key) => {
      acc[key] = key.length
      return acc
    }, {})
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = String((row as Record<string, unknown>)[key] ?? '')
        maxLens[key] = Math.max(maxLens[key], val.length)
      })
    })
    worksheet['!cols'] = Object.keys(maxLens).map(key => ({
      wch: Math.min(Math.max(maxLens[key] + 3, 10), 50)
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings')
    XLSX.writeFile(workbook, `bookings_${range.from}_to_${range.to}.xlsx`)
    showToast(t('excelDownloadStarted'), 'success')
  }

  // ── Analytics: bucketed income ──────────────────────────────────────────────
  const analytics = useMemo(() => {
    const from = parseISO(range.from), to = parseISO(range.to)
    const span = Math.max(0, differenceInCalendarDays(to, from))
    const byWeek = span > 34
    const buckets = byWeek
      ? eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).map(s => ({ start: s, end: addDays(s, 6) }))
      : eachDayOfInterval({ start: from, end: to }).map(d => ({ start: d, end: d }))

    const data = buckets.map(bk => {
      const s = format(bk.start, 'yyyy-MM-dd'), e = format(bk.end, 'yyyy-MM-dd')
      const inBucket = bookings.filter(b => b.date >= s && b.date <= e)
      const expected = inBucket.reduce((tot, b) => tot + (b.totalPrice || 0), 0)
      const collected = inBucket.reduce((tot, b) => tot + amountCollected(b), 0)
      return {
        label: byWeek ? format(bk.start, 'MMM d', { locale }) : format(bk.start, span <= 8 ? 'EEE d' : 'MMM d', { locale }),
        expected, collected, count: inBucket.length,
      }
    })

    const total = bookings.reduce((tot, b) => tot + (b.totalPrice || 0), 0)
    const collected = bookings.reduce((tot, b) => tot + amountCollected(b), 0)
    return { data, byWeek, total, collected, due: total - collected, count: bookings.length }
  }, [bookings, range.from, range.to, locale])

  // Income per service (breakdown)
  const perService = useMemo(() => {
    const map = new Map<string, number>()
    bookings.forEach(b => map.set(svcId(b), (map.get(svcId(b)) || 0) + (b.totalPrice || 0)))
    return services
      .map(s => ({ svc: s, total: map.get(s._id) || 0 }))
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [bookings, services])

  // Occupancy: booked time vs. the service's *available* time in the range.
  // Available minutes = Σ over each open day (per weekly schedule / blackouts) of
  // (close − open) × capacity. Utilization = booked ÷ available (capped at 100%).
  const occupancy = useMemo(() => {
    const days = eachDayOfInterval({ start: parseISO(range.from), end: parseISO(range.to) })
      .map(d => format(d, 'yyyy-MM-dd'))
    const bookedByService = new Map<string, number>()
    const dowCount = [0, 0, 0, 0, 0, 0, 0]
    bookings.forEach(b => {
      bookedByService.set(svcId(b), (bookedByService.get(svcId(b)) || 0) + (b.duration || 0))
      if (b.date) dowCount[weekdayOf(b.date)]++
    })
    const perSvc = services.map(s => {
      const cap = s.capacity || 1
      let availMin = 0
      for (const day of days) {
        const h = hoursForDate(s, day)
        if (h.closed) continue
        availMin += Math.max(0, toMin(h.close) - toMin(h.open)) * cap
      }
      const bookedMin = bookedByService.get(s._id) || 0
      const util = availMin > 0 ? Math.min(1, bookedMin / availMin) : 0
      return { svc: s, bookedMin, availMin, util }
    })
      .filter(x => x.availMin > 0 || x.bookedMin > 0)
      .sort((a, b) => b.util - a.util)
    const totalAvail = perSvc.reduce((sum, x) => sum + x.availMin, 0)
    const totalBooked = perSvc.reduce((sum, x) => sum + x.bookedMin, 0)
    const overall = totalAvail > 0 ? Math.min(1, totalBooked / totalAvail) : 0
    const peakDow = dowCount.some(c => c > 0) ? dowCount.indexOf(Math.max(...dowCount)) : null
    return { perSvc, overall, peakDow, totalBooked, totalAvail }
  }, [bookings, services, range.from, range.to])

  const allHotelsOn = fHotels.size === 0
  const allServicesOn = fServices.size === 0
  const activeFilterCount = (fHotels.size ? 1 : 0) + (fServices.size ? 1 : 0) + (fPayment !== 'all' ? 1 : 0) + (fType !== 'all' ? 1 : 0) + (fState !== 'all' ? 1 : 0) + (search ? 1 : 0)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  function clearFilters() {
    setFHotels(new Set()); setFServices(new Set()); setFPayment('all'); setFType('all'); setFState('all'); setSearch('')
  }

  return {
    router, showToast,
    services, hotels,
    period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo, range,
    loading, bookings,
    search, setSearch, fHotels, setFHotels, fServices, setFServices,
    fPayment, setFPayment, fType, setFType, fState, setFState, sortKey, sortDir,
    detailId, setDetailId, serviceHotel,
    patchLocal, handleDeleted, exportToExcel, toggleSort, clearFilters,
    rows, analytics, perService, occupancy,
    allHotelsOn, allServicesOn, activeFilterCount,
  }
}

export type DashboardPageState = ReturnType<typeof useDashboardPage>
