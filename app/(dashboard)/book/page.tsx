'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation, DictionaryKeys } from '@/lib/i18n'
import { getServiceIcon } from '@/lib/serviceIcons'
import { nowUZ } from '@/lib/timezone'
import { Users, BedDouble, SlidersHorizontal, ArrowLeft, Check, Search, Clock } from 'lucide-react'
import { getServices } from '@/lib/api/services'
import { getHotels } from '@/lib/api/hotels'
import { getBookings, createBooking } from '@/lib/api/bookings'
import { getClients } from '@/lib/api/clients'

interface PricingPlan { duration: number; price: number }
interface PricingGroup { target: 'room' | 'client'; category: string; rows: PricingPlan[] }

interface Service {
  _id: string
  name: string
  description: string
  location: string
  openTime: string
  closeTime: string
  slotDuration: number
  capacity: number
  price?: number
  isFree?: boolean
  details?: string
  bufferTimeBefore?: number
  bufferTimeAfter?: number
  pricingPlans?: PricingPlan[]
  pricingGroups?: PricingGroup[]
  color: string
  isActive: boolean
  hotelId: string | { _id: string; name?: string; shortName?: string }
  sharedHotelIds?: string[]
}

// A service is available to a hotel if that hotel owns it or it's shared with it.
function serviceAvailableToHotel(s: Service, hotelId: string): boolean {
  if (extractHotelId(s.hotelId) === hotelId) return true
  return (s.sharedHotelIds ?? []).map(h => (typeof h === 'string' ? h : (h as { _id: string })._id)).includes(hotelId)
}

interface Room {
  _id: string
  hotelId: string
  number: string
  floor: number
  type?: string
}

interface Hotel {
  _id: string
  shortName: string
  name?: string
}

interface ClientGroup {
  _id: string
  name: string
  color: string
}

interface Client {
  _id: string
  name: string
  phone: string
  roomNumber: string
  floor: number
}

type BookingType = 'client' | 'room' | 'custom'


const TYPE_META: Record<BookingType, { labelKey: DictionaryKeys; descKey: DictionaryKeys; color: string; icon: React.ReactNode }> = {
  client: { labelKey: 'clients', descKey: 'bookClientDesc', color: '#3b82f6', icon: <Users size={22} /> },
  room: { labelKey: 'rooms', descKey: 'bookRoomDesc', color: '#10b981', icon: <BedDouble size={22} /> },
  custom: { labelKey: 'typeCustom', descKey: 'bookCustomDesc', color: '#f59e0b', icon: <SlidersHorizontal size={22} /> },
}

function generateTimeSlots(openTime: string, closeTime: string, activeDuration: number): string[] {
  if (!activeDuration) return []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  let start = openH * 60 + openM
  if (start % 15 !== 0) start = start + (15 - (start % 15))

  const end = closeH * 60 + closeM
  const slots: string[] = []
  for (let t = start; t + activeDuration <= end; t += 15) {
    const h = Math.floor(t / 60).toString().padStart(2, '0')
    const m = (t % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
  }
  return slots
}

function slotEnd(startTime: string, duration: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + duration
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function extractHotelId(hotelId: Service['hotelId']): string {
  if (!hotelId) return ''
  return typeof hotelId === 'string' ? hotelId : (hotelId._id || '')
}

function formatDuration(min: number): string {
  if (min >= 60 && min % 60 === 0) return `${min / 60}h`
  if (min > 60) return `${Math.floor(min / 60)}h ${min % 60}m`
  return `${min}m`
}

function formatUZS(v: number): string {
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function BookPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

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
  const [dayBookings, setDayBookings] = useState<Array<{ startTime: string; bufferedEndTime?: string; endTime: string; status: string }>>([])

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
        const filtered = Array.isArray(data)
          ? data.filter((b: any) => b.status !== 'cancelled' && (typeof b.serviceId === 'string' ? b.serviceId : b.serviceId?._id) === selectedService._id)
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

  const hotelServices = services.filter(s => serviceAvailableToHotel(s, selectedHotelId))

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
      router.push(`/calendar?date=${date}`)
    } catch (err: any) {
      showToast(err.message || t('createBookingFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Small UI helpers ─────────────────────────────────────────────────────────

  const backBtn = (to: number) => (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(to)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <ArrowLeft size={14} /> {t('back')}
    </button>
  )

  // Context chips shown at the top of later steps
  const contextBar = selectedService && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
      <span style={chipStyle('var(--gray-100)', 'var(--gray-600)')}>
        {hotels.find(h => h._id === selectedHotelId)?.shortName || t('hotel')}
      </span>
      <span style={chipStyle(`${selectedService.color}18`, selectedService.color)}>
        <span style={{ display: 'inline-flex' }}>{getServiceIcon(selectedService.name)}</span> {selectedService.name}
      </span>
      {bookingType && (
        <span style={chipStyle(`${TYPE_META[bookingType].color}18`, TYPE_META[bookingType].color)}>
          {t(TYPE_META[bookingType].labelKey)}
        </span>
      )}
      {categoryMeta && (
        <span style={chipStyle(`${categoryMeta.color}18`, categoryMeta.color)}>
          {categoryMeta.label}
        </span>
      )}
      {activePlan && (bookingType === 'custom' || selectedPlan) && (
        <span style={chipStyle('var(--brand-50)', 'var(--brand-700)')}>
          {formatDuration(activePlan.duration)} · {activePlan.price > 0 ? `${formatUZS(activePlan.price)} ${t('sum')}` : t('isFree')}
        </span>
      )}
    </div>
  )

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header">
        <div>
          <h1>{t('newBooking')}</h1>
          <p style={{ marginTop: 4 }}>{t('reserveForGuest')}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem' }}>
        {[
          { n: 1, label: t('hotel') },
          { n: 2, label: t('service') },
          { n: 3, label: t('stepPlan') },
          { n: 4, label: t('stepDateTime') },
          { n: 5, label: t('stepConfirm') },
        ].map(({ n, label }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step >= n ? 'var(--brand-500)' : 'var(--gray-200)',
              color: step >= n ? '#fff' : 'var(--gray-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.2s', flexShrink: 0,
            }}>{step > n ? <Check size={14} /> : n}</div>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: step === n ? 600 : 400,
              color: step === n ? 'var(--gray-800)' : 'var(--gray-400)',
              whiteSpace: 'nowrap',
            }}>{label}</span>
            {n < 5 && <div style={{ flex: 1, height: 2, background: step > n ? 'var(--brand-500)' : 'var(--gray-200)', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Step 1: Hotel ── */}
        {step === 1 && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <h2 style={{ marginBottom: '1rem' }}>{t('chooseHotel')}</h2>
            {hotels.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><BedDouble size={24} /></div>
                <h3>{t('noHotelsFound')}</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {hotels.map(hotel => (
                  <button
                    key={hotel._id}
                    type="button"
                    onClick={() => chooseHotel(hotel._id)}
                    style={optionCardStyle(selectedHotelId === hotel._id, 'var(--brand-500)')}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-800)' }}>{hotel.shortName}</div>
                    {hotel.name && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 2 }}>{hotel.name}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Service ── */}
        {step === 2 && selectedHotelId && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              {backBtn(1)}
              <h2 style={{ margin: 0 }}>{t('chooseService')}</h2>
            </div>
            {hotelServices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
                <h3>{t('noActiveServicesHotel')}</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {hotelServices.map(svc => (
                  <button
                    key={svc._id}
                    type="button"
                    onClick={() => chooseService(svc)}
                    style={optionCardStyle(selectedService?._id === svc._id, svc.color)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, marginBottom: 10,
                      background: `${svc.color}18`, color: svc.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {getServiceIcon(svc.name)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)', marginBottom: 2 }}>{svc.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                      {(svc.pricingGroups?.length ?? 0) > 0
                        ? (svc.pricingGroups!.length === 1
                          ? t('categoryPriced', { count: svc.pricingGroups!.length })
                          : t('categoriesPriced', { count: svc.pricingGroups!.length }))
                        : svc.isFree ? t('isFree') : t('customPricing')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Plan (type → category → plan, or custom) ── */}
        {step === 3 && selectedService && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              {backBtn(2)}
              <h2 style={{ margin: 0 }}>{t('choosePlan')}</h2>
            </div>
            {contextBar}

            {/* Type selector */}
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>{t('whoIsThisFor')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: planReady || bookingType ? '1.5rem' : 0 }}>
              {(Object.keys(TYPE_META) as BookingType[]).map(type => {
                const meta = TYPE_META[type]
                const disabled = (type === 'client' && clientCats.length === 0) || (type === 'room' && roomCats.length === 0)
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={disabled}
                    onClick={() => chooseType(type)}
                    title={disabled ? t('noPricingSetFor', { label: t(meta.labelKey).toLowerCase() }) : undefined}
                    style={{
                      ...optionCardStyle(bookingType === type, meta.color),
                      opacity: disabled ? 0.45 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, marginBottom: 10,
                      background: `${meta.color}18`, color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{meta.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gray-800)' }}>{t(meta.labelKey)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 2 }}>
                      {disabled ? t('notConfigured') : t(meta.descKey)}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Category + plan rows (client / room) */}
            {(bookingType === 'client' || bookingType === 'room') && (
              <>
                <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
                  {bookingType === 'client' ? t('chooseClientGroup') : t('chooseRoomCategory')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: selectedCategory ? '1.5rem' : 0 }}>
                  {(bookingType === 'client' ? clientCats : roomCats).map(g => {
                    const meta = resolveGroupMeta(g)
                    const active = selectedCategory === g.category
                    return (
                      <button
                        key={g.category}
                        type="button"
                        onClick={() => chooseCategory(g.category)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 999,
                          border: `2px solid ${active ? meta.color : 'var(--gray-200)'}`,
                          background: active ? `${meta.color}15` : '#fff',
                          color: active ? meta.color : 'var(--gray-700)',
                          fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                        {meta.label}
                      </button>
                    )
                  })}
                </div>

                {selectedCategory && (
                  <>
                    <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>{t('chooseDurationPrice')}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {planRows.map((plan, i) => {
                        const active = selectedPlan?.duration === plan.duration && selectedPlan?.price === plan.price
                        const accent = categoryMeta?.color || selectedService.color
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setSelectedPlan(plan); setSelectedSlot('') }}
                            style={{
                              padding: '10px 16px', borderRadius: 10,
                              border: `2px solid ${active ? accent : 'var(--gray-200)'}`,
                              background: active ? `${accent}15` : '#fff',
                              textAlign: 'left', cursor: 'pointer', minWidth: 110,
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{formatDuration(plan.duration)}</div>
                            <div style={{ fontSize: '0.78rem', color: accent, fontWeight: 600 }}>
                              {plan.price > 0 ? `${formatUZS(plan.price)} ${t('sum')}` : t('isFree')}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Custom inputs */}
            {bookingType === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 420 }}>
                <div className="form-group">
                  <label className="form-label">{t('durationMin')}</label>
                  <input
                    type="number" className="form-input" min={15} step={15}
                    value={customDuration}
                    onChange={e => { setCustomDuration(Number(e.target.value)); setSelectedSlot('') }}
                    onFocus={e => e.currentTarget.select()}
                    aria-invalid={!customValid}
                    style={!customValid ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                  />
                  <small style={{ color: customValid ? 'var(--gray-400)' : 'var(--danger)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>
                    {customValid ? t('minute15Intervals') : t('multipleOf15')}
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('priceUzs')}</label>
                  <input
                    type="text" inputMode="numeric" className="form-input"
                    value={customPrice ? formatUZS(customPrice) : ''}
                    onChange={e => setCustomPrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
                    onFocus={e => e.currentTarget.select()}
                    placeholder="0"
                  />
                  <small style={{ color: 'var(--gray-400)', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>{t('setOneOffPrice')}</small>
                </div>
              </div>
            )}

            {planReady && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>{t('continueBtn')}</button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Date & Time ── */}
        {step === 4 && selectedService && activePlan && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              {backBtn(3)}
              <h2 style={{ margin: 0 }}>{t('pickDateTime')}</h2>
            </div>
            {contextBar}

            <div className="form-group" style={{ marginBottom: '1.25rem', maxWidth: 240 }}>
              <label className="form-label">{t('date')}</label>
              <input
                type="date" className="form-input"
                value={date}
                min={nowUZ().toISOString().split('T')[0]}
                onChange={e => { setDate(e.target.value); setSelectedSlot('') }}
                required
              />
            </div>

            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> {t('availableSlots', { duration: formatDuration(activePlan.duration) })}
            </label>
            {timeSlots.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>{t('noSlotsForDuration')}</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {timeSlots.map(slot => {
                  // Mirror the server's buffered-overlap rule: the candidate booking
                  // reserves [start - bufferBefore, end + bufferAfter], and must not
                  // overlap any existing booking's raw [start, end] for this service.
                  const before = selectedService.bufferTimeBefore || 0
                  const after = selectedService.bufferTimeAfter || 0
                  const start = toMin(slot)
                  const end = start + activePlan.duration
                  const bufferedStart = start - before
                  const bufferedEnd = end + after
                  const booked = dayBookings.some(b =>
                    toMin(b.startTime) < bufferedEnd && toMin(b.endTime) > bufferedStart
                  )
                  const selected = selectedSlot === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={booked}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        border: `1.5px solid ${selected ? selectedService.color : 'var(--gray-200)'}`,
                        background: selected ? selectedService.color : booked ? 'var(--gray-100)' : '#fff',
                        color: selected ? '#fff' : booked ? 'var(--gray-300)' : 'var(--gray-700)',
                        fontSize: '0.8125rem', fontWeight: selected ? 600 : 400,
                        cursor: booked ? 'not-allowed' : 'pointer',
                        textDecoration: booked ? 'line-through' : 'none',
                      }}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}

            {selectedSlot && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={() => setStep(5)}>Continue →</button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Guest details & summary ── */}
        {step === 5 && selectedService && activePlan && selectedSlot && (
          <div className="card" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              {backBtn(4)}
              <h2 style={{ margin: 0 }}>{t('confirmBooking')}</h2>
            </div>
            {contextBar}

            {/* CLIENT: search saved clients in group, or type a new guest */}
            {bookingType === 'client' && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">{t('guestsIn', { group: categoryMeta?.label ?? '' })}</label>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 34 }}
                    placeholder={t('searchThisGroup')}
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                  />
                </div>
                {clientResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                    {clientResults.map(c => {
                      const active = selectedClientId === c._id
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => pickClient(c)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            border: `1.5px solid ${active ? 'var(--brand-500)' : 'var(--gray-200)'}`,
                            background: active ? 'var(--brand-50)' : '#fff',
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'var(--brand-100)', color: 'var(--brand-600)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                          }}>{c.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.875rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                              {c.roomNumber ? `🏨 ${c.roomNumber}` : ''}{c.phone ? `${c.roomNumber ? ' · ' : ''}${c.phone}` : ''}
                            </div>
                          </div>
                          {active && <Check size={16} style={{ marginLeft: 'auto', color: 'var(--brand-500)' }} />}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: 0 }}>
                    {clientSearch ? t('noSavedGuestsMatch') : t('noSavedGuests')}
                  </p>
                )}
              </div>
            )}

            {/* ROOM: pick a room of the chosen category */}
            {bookingType === 'room' && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">{t('room')} ({categoryMeta?.label})</label>
                {categoryRooms.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: 0 }}>
                    {t('noRoomsCategory')}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {categoryRooms.map(r => {
                      const active = selectedRoomId === r._id
                      return (
                        <button
                          key={r._id}
                          type="button"
                          onClick={() => pickRoom(r)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8,
                            border: `1.5px solid ${active ? 'var(--brand-500)' : 'var(--gray-200)'}`,
                            background: active ? 'var(--brand-50)' : '#fff',
                            color: active ? 'var(--brand-700)' : 'var(--gray-700)',
                            fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                          }}
                        >
                          <BedDouble size={14} /> {roomLabel(r)}
                          <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 400 }}>· {t('floorShort')} {r.floor}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Guest name + phone (all types) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('guestName')} *</label>
                <input
                  type="text" className="form-input" placeholder={t('fullNamePlaceholder')}
                  value={customerName}
                  onChange={e => { setCustomerName(e.target.value); if (selectedClientId) setSelectedClientId(null) }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('phone')}</label>
                <input
                  type="tel" className="form-input" placeholder="+998 90 123 4567"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Room number field for client/custom types (room type already set above) */}
            {bookingType !== 'room' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">{t('roomNumberField')}</label>
                <input
                  className="form-input" placeholder={t('roomNumberPlaceholder')}
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">{t('notesOptional')}</label>
              <textarea
                className="form-textarea" placeholder={t('specialRequirements')}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{t('payment')}</label>
              {activePlan.price === 0 ? (
                <div style={{ ...chipStyle('#3b82f618', '#2563eb'), padding: '8px 12px' }}>{t('freeNoPayment')}</div>
              ) : (
                <select
                  className="form-select" style={{ maxWidth: 200 }}
                  value={paid ? 'paid' : 'unpaid'}
                  onChange={e => setPaid(e.target.value === 'paid')}
                >
                  <option value="unpaid">🔴 {t('unpaid')}</option>
                  <option value="paid">✓ {t('paid')}</option>
                </select>
              )}
            </div>

            {/* Order summary */}
            <div style={{
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 10,
              padding: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem',
              display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.45rem 1rem', color: 'var(--gray-600)',
            }}>
              <strong style={{ color: 'var(--gray-800)' }}>{t('service')}</strong>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: selectedService.color, display: 'inline-flex' }}>{getServiceIcon(selectedService.name)}</span>
                {selectedService.name}
              </span>

              <strong style={{ color: 'var(--gray-800)' }}>{t('toWhom')}</strong>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {customerName || <span style={{ color: 'var(--gray-300)' }}>—</span>}
                {categoryMeta && (
                  <span style={chipStyle(`${categoryMeta.color}18`, categoryMeta.color)}>{categoryMeta.label}</span>
                )}
                {bookingType === 'room' && roomNumber && (
                  <span style={chipStyle('var(--gray-100)', 'var(--gray-600)')}>🏨 {roomNumber}</span>
                )}
                {bookingType === 'custom' && <span style={chipStyle('#f59e0b18', '#b45309')}>{t('typeCustom')}</span>}
              </span>

              <strong style={{ color: 'var(--gray-800)' }}>{t('whenLabel')}</strong>
              <span>{date} · {selectedSlot} – {slotEnd(selectedSlot, activePlan.duration)} ({formatDuration(activePlan.duration)})</span>

              <strong style={{ color: 'var(--gray-800)' }}>{t('howMuch')}</strong>
              <span style={{ color: 'var(--brand-700)', fontWeight: 700 }}>
                {activePlan.price === 0 ? t('isFree') : `${formatUZS(activePlan.price)} ${t('sum')}`}
              </span>

              <strong style={{ color: 'var(--gray-800)' }}>{t('payment')}</strong>
              <span>{activePlan.price === 0 ? t('free') : paid ? `✓ ${t('paid')}` : `🔴 ${t('unpaid')}`}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/calendar')}>{t('cancel')}</button>
              <button
                id="confirm-booking-btn"
                type="submit"
                className="btn btn-primary"
                disabled={loading || !customerName.trim()}
              >
                {loading ? <span className="spinner" /> : null}
                {loading ? t('creating') : t('confirmBooking')}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

// ── Inline style helpers ───────────────────────────────────────────────────────

function chipStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 999,
    background: bg, color, fontWeight: 600, fontSize: '0.75rem',
  }
}

function optionCardStyle(active: boolean, accent: string): React.CSSProperties {
  return {
    border: `2px solid ${active ? accent : 'var(--gray-200)'}`,
    borderRadius: 12, padding: '1rem', textAlign: 'left', cursor: 'pointer',
    background: active ? `${accent}12` : '#fff', transition: 'all 0.15s ease',
  }
}
