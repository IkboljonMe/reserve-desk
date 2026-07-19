'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Minus, ShoppingBag, Check, Sparkles, UtensilsCrossed } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { localized, computeServiceFee, guestFoodPath, MENU_LANGS, MENU_LANG_LABELS } from '@/lib/menu'
import { money } from '@/lib/bookingHelpers'
import { ORDER_STATUS_META } from '../constants'
import type { MenuCategory, MenuProduct, OrderStatus } from '../types'

export interface GuestLabels {
  room: string; sum: string; menuEmpty: string; add: string; total: string; close: string; cancel: string
  yourOrder: string; viewOrder: string; placeOrder: string; placingOrder: string
  orderPlaced: string; orderPlacedDesc: string; emptyCart: string
  subtotal: string; serviceFee: string; roomNumber: string
  guestNamePlaceholder: string; orderNotePlaceholder: string
  orderFailed: string; roomRequiredError: string; itemsN: string
  cancelledTitle: string; cancelledSub: string; orderNo: string
  couldNotLoad: string; backToMenu: string; orderSummary: string; notes: string
  orderPending: string; orderPreparing: string; orderReady: string; orderDelivered: string
  recommendedToday: string
}

interface TrackedOrder {
  status: OrderStatus
  items: { name: string; price: number; quantity: number }[]
  subtotal: number
  serviceFee: number
  total: number
  note: string
}

const LOCALES = ['uz', 'ru', 'en'] as const
const FIELD = 'w-full px-3 py-2 min-h-[42px] rounded-lg text-sm outline-none bg-[var(--surface-card)] border border-[var(--surface-border)] text-[var(--gray-800)] focus:border-[var(--brand-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]'
const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered']

export function GuestMenuClient({
  labels, locale, hotelName, hotelSlug, room, categories, products, recommendations = [], serviceFeeType, serviceFeeValue,
}: {
  labels: GuestLabels
  locale: string
  hotelName: string
  hotelSlug: string
  room: string
  categories: MenuCategory[]
  products: MenuProduct[]
  recommendations?: MenuProduct[]
  serviceFeeType: 'none' | 'percent' | 'fixed'
  serviceFeeValue: number
}) {
  const cartKey = `bronit-menu-cart:${hotelSlug}:${room || 'guest'}`
  // The menu's food/category text can be shown in any of the 10 content
  // languages, independent of the page chrome's locale (uz/ru/en, ?locale).
  const [contentLang, setContentLang] = useState(locale)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [roomNumber, setRoomNumber] = useState(room)
  const [guestName, setGuestName] = useState('')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(null)
  const [tracked, setTracked] = useState<TrackedOrder | null>(null)
  const [trackLoading, setTrackLoading] = useState(true)
  const [error, setError] = useState('')

  // Load any cart the guest left behind (e.g. tab closed mid-browse), scoped to
  // this hotel+room so two rooms on the same device don't share a basket.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey)
      if (raw) setCart(JSON.parse(raw))
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true)
  }, [cartKey])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart))
    } catch {
      /* storage full / unavailable */
    }
  }, [cart, hydrated, cartKey])

  // Poll the placed order's status so the guest sees it move pending → … → delivered.
  useEffect(() => {
    if (!placed) return
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(`/api/menu/guest/order/${placed.id}?hotel=${encodeURIComponent(hotelSlug)}`, { cache: 'no-store' })
        if (res.ok && alive) setTracked(await res.json())
      } catch {
        /* keep last known state */
      } finally {
        if (alive) setTrackLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 4000)
    return () => { alive = false; clearInterval(timer) }
  }, [placed])

  const productById = useMemo(() => new Map(products.map(p => [p._id, p])), [products])
  const setQty = (id: string, qty: number) =>
    setCart(c => { const n = { ...c }; if (qty <= 0) delete n[id]; else n[id] = qty; return n })

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ p: productById.get(id), qty }))
    .filter((l): l is { p: MenuProduct; qty: number } => !!l.p)
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0)
  const fee = computeServiceFee(subtotal, serviceFeeType, serviceFeeValue)
  const total = subtotal + fee

  const byCategory = (cid: string) => products.filter(p => p.categoryId === cid && p.available)

  async function placeOrder() {
    if (!roomNumber.trim()) { setError(labels.roomRequiredError); return }
    if (count === 0) return
    setPlacing(true); setError('')
    try {
      const res = await fetch('/api/menu/guest/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel: hotelSlug, room: roomNumber.trim(), guestName, note,
          items: lines.map(l => ({ productId: l.p._id, quantity: l.qty })),
        }),
      })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setPlaced({ id: data.id, total: typeof data.total === 'number' ? data.total : total })
      setTracked(null)
      setTrackLoading(true)
      setCart({}); setNote('')
    } catch {
      setError(labels.orderFailed)
    } finally {
      setPlacing(false)
    }
  }

  function closeCart() {
    setCartOpen(false)
    setPlaced(null)
    setTracked(null)
  }

  function Stepper({ id }: { id: string }) {
    const qty = cart[id] || 0
    if (qty === 0) {
      return (
        <Button size="sm" leftIcon={<Plus size={13} strokeWidth={2.6} />} onClick={() => setQty(id, 1)}>{labels.add}</Button>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => setQty(id, qty - 1)} className="w-7 h-7 rounded-full border border-[var(--surface-border)] flex items-center justify-center text-[var(--gray-700)]" aria-label="−"><Minus size={14} /></button>
        <span className="w-5 text-center font-bold tabular-nums">{qty}</span>
        <button onClick={() => setQty(id, qty + 1)} className="w-7 h-7 rounded-full bg-[var(--brand-500)] text-white flex items-center justify-center" aria-label="+"><Plus size={14} /></button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[var(--surface-bg)] text-[var(--gray-900)] pb-24">
      <header className="sticky top-0 z-10 bg-[var(--surface-card)] border-b border-[var(--surface-border)]">
        <div className="max-w-[448px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.05rem] font-extrabold truncate m-0">{hotelName}</h1>
            {room && <p className="text-[0.8rem] text-[var(--gray-500)] m-0 mt-0.5">{labels.room} {room}</p>}
          </div>
          <nav className="flex items-center gap-1.5 shrink-0">
            <select
              value={contentLang}
              onChange={e => setContentLang(e.target.value)}
              aria-label="Menu language"
              className="px-2 py-1 rounded-md text-[0.75rem] font-bold bg-[var(--gray-100)] text-[var(--gray-700)] border-none outline-none cursor-pointer"
            >
              {MENU_LANGS.map(l => (
                <option key={l} value={l}>{MENU_LANG_LABELS[l]}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              {LOCALES.map(l => (
                <a key={l} href={guestFoodPath(l, hotelSlug, room)} className={`px-2 py-1 rounded-md text-[0.75rem] font-bold uppercase ${l === locale ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--gray-500)] hover:bg-[var(--gray-100)]'}`}>{l}</a>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-[448px] mx-auto px-4 py-5 flex flex-col gap-6">
        <RecommendationBanner
          items={recommendations}
          contentLang={contentLang}
          labels={labels}
          onAdd={p => setQty(p._id, (cart[p._id] || 0) + 1)}
        />
        {categories.every(c => byCategory(c._id).length === 0) ? (
          <p className="text-center text-[var(--gray-400)] text-sm py-16">{labels.menuEmpty}</p>
        ) : (
          categories.map(cat => {
            const prods = byCategory(cat._id)
            if (prods.length === 0) return null
            return (
              <section key={cat._id}>
                <h2 className="text-[1.1rem] font-bold mb-3 text-[var(--gray-800)]">{localized(cat.nameI18n, cat.name, contentLang)}</h2>
                <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                  {prods.map(p => {
                    const name = localized(p.nameI18n, p.name, contentLang)
                    const desc = localized(p.descI18n, p.description, contentLang)
                    return (
                      <li key={p._id} className="flex gap-3 items-center bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-xl p-3 shadow-sm">
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotel-supplied URLs
                          <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[0.95rem] text-[var(--gray-800)]">{name}</div>
                          {desc && <p className="text-[0.8rem] text-[var(--gray-500)] mt-0.5 leading-snug line-clamp-2">{desc}</p>}
                          <div className="font-extrabold text-[0.9rem] text-[var(--brand-600)] mt-1 tabular-nums">{money(p.price)} {labels.sum}</div>
                        </div>
                        <div className="shrink-0"><Stepper id={p._id} /></div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })
        )}
      </main>

      {/* Sticky cart bar */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-[var(--surface-bg)] to-transparent">
          <button
            onClick={() => { setError(''); setCartOpen(true) }}
            className="max-w-[448px] mx-auto w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-[var(--brand-500)] text-white font-bold shadow-lg"
          >
            <span className="inline-flex items-center gap-2"><ShoppingBag size={18} /> {labels.itemsN.replace('{n}', String(count))}</span>
            <span className="tabular-nums">{labels.viewOrder} · {money(total)} {labels.sum}</span>
          </button>
        </div>
      )}

      <Modal
        open={cartOpen}
        onClose={closeCart}
        title={placed ? labels.orderPlaced : labels.yourOrder}
        size="sm"
        closeLabel={labels.close}
        footer={placed ? (
          <Button variant="secondary" className="w-full justify-center" onClick={closeCart}>{labels.backToMenu}</Button>
        ) : (
          <Button className="w-full justify-center" loading={placing} disabled={count === 0} onClick={placeOrder}>
            {placing ? labels.placingOrder : `${labels.placeOrder} · ${money(total)} ${labels.sum}`}
          </Button>
        )}
      >
        {placed ? (
          <OrderTracker placed={placed} tracked={tracked} loading={trackLoading} labels={labels} />
        ) : count === 0 ? (
          <p className="text-center text-[var(--gray-400)] py-10">{labels.emptyCart}</p>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {lines.map(l => (
                <li key={l.p._id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[0.9rem] text-[var(--gray-800)] truncate">{localized(l.p.nameI18n, l.p.name, contentLang)}</div>
                    <div className="text-[0.78rem] text-[var(--gray-500)] tabular-nums">{money(l.p.price)} {labels.sum}</div>
                  </div>
                  <Stepper id={l.p._id} />
                  <div className="w-20 text-right font-bold text-[0.88rem] tabular-nums shrink-0">{money(l.p.price * l.qty)}</div>
                </li>
              ))}
            </ul>

            <div className="border-t border-[var(--surface-border)] pt-3 flex flex-col gap-1.5 text-[0.85rem]">
              <div className="flex justify-between text-[var(--gray-600)]"><span>{labels.subtotal}</span><span className="tabular-nums">{money(subtotal)} {labels.sum}</span></div>
              {fee > 0 && <div className="flex justify-between text-[var(--gray-600)]"><span>{labels.serviceFee}</span><span className="tabular-nums">{money(fee)} {labels.sum}</span></div>}
              <div className="flex justify-between font-extrabold text-[var(--gray-900)] text-[0.95rem]"><span>{labels.total}</span><span className="tabular-nums">{money(total)} {labels.sum}</span></div>
            </div>

            <div className="flex flex-col gap-2">
              <input className={FIELD} inputMode="numeric" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder={labels.roomNumber} />
              <input className={FIELD} value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={labels.guestNamePlaceholder} />
              <textarea className={`${FIELD} resize-y min-h-[56px]`} value={note} onChange={e => setNote(e.target.value)} placeholder={labels.orderNotePlaceholder} />
              {error && <p className="text-[0.8rem] text-[var(--color-danger)] font-medium m-0">{error}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* --------------------------- Recommendation banner --------------------------- */

// Auto-rotating, swipeable banner of "today's picks" (scroll-snap, no extra
// animation dependency). Hidden entirely when nothing is featured today.
function RecommendationBanner({
  items, contentLang, labels, onAdd,
}: {
  items: MenuProduct[]
  contentLang: string
  labels: GuestLabels
  onAdd: (product: MenuProduct) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => {
      const track = trackRef.current
      if (!track) return
      const next = (active + 1) % items.length
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
    }, 5000)
    return () => clearInterval(timer)
  }, [active, items.length])

  if (items.length === 0) return null

  function onScroll() {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    const idx = Math.round(track.scrollLeft / track.clientWidth)
    if (idx !== active) setActive(idx)
  }

  return (
    <section>
      <div className="flex items-center gap-1.5 text-[var(--brand-600)] mb-2">
        <Sparkles size={14} />
        <h2 className="text-[0.75rem] font-bold uppercase tracking-wide m-0">{labels.recommendedToday}</h2>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(p => {
          const name = localized(p.nameI18n, p.name, contentLang)
          const desc = localized(p.descI18n, p.description, contentLang)
          return (
            <div key={p._id} className="relative h-36 w-full shrink-0 snap-center overflow-hidden">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotel-supplied URLs
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--gray-100)] text-[var(--gray-400)]">
                  <UtensilsCrossed size={30} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-white text-[1.05rem] m-0">{name}</h3>
                  {desc && <p className="truncate text-white/70 text-[0.72rem] mt-0.5 m-0">{desc}</p>}
                  <div className="font-bold text-white text-[0.85rem] mt-1 tabular-nums">{money(p.price)} {labels.sum}</div>
                </div>
                <button
                  onClick={() => onAdd(p)}
                  className="w-9 h-9 rounded-full bg-[var(--brand-500)] text-white flex items-center justify-center shrink-0"
                  aria-label={labels.add}
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {items.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((p, i) => (
            <span key={p._id} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-[var(--brand-500)]' : 'w-1.5 bg-[var(--gray-200)]'}`} />
          ))}
        </div>
      )}
    </section>
  )
}

/* ------------------------------- Order tracker ------------------------------- */

function OrderTracker({
  placed, tracked, loading, labels,
}: {
  placed: { id: string; total: number }
  tracked: TrackedOrder | null
  loading: boolean
  labels: GuestLabels
}) {
  const statusLabel = (s: OrderStatus): string =>
    ({ pending: labels.orderPending, preparing: labels.orderPreparing, ready: labels.orderReady, delivered: labels.orderDelivered } as Record<string, string>)[s] ?? s
  const currentIndex = tracked ? STATUS_FLOW.indexOf(tracked.status) : -1
  const cancelled = tracked?.status === 'cancelled'

  return (
    <div className="flex flex-col gap-5 py-1">
      <div className="flex flex-col items-center text-center gap-2.5">
        <span className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center"><Check size={30} /></span>
        <h3 className="font-extrabold text-[1.1rem] m-0">{labels.orderPlaced}</h3>
        <p className="text-[var(--gray-500)] text-sm m-0">{labels.orderPlacedDesc}</p>
        <p className="text-[0.78rem] text-[var(--gray-400)] m-0">{labels.orderNo} #{placed.id.slice(-6).toUpperCase()}</p>
      </div>

      {!tracked ? (
        loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <p className="text-center text-[var(--gray-400)] text-sm py-6">{labels.couldNotLoad}</p>
        )
      ) : cancelled ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="font-bold m-0 text-[var(--color-danger)]">{labels.cancelledTitle}</p>
          <p className="text-sm mt-1 m-0 text-[var(--gray-600)]">{labels.cancelledSub}</p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {STATUS_FLOW.map((status, idx) => {
            const done = idx < currentIndex
            const active = idx === currentIndex
            const meta = ORDER_STATUS_META[status]
            return (
              <li key={status} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : !active ? 'bg-[var(--gray-100)] text-[var(--gray-400)]' : 'text-white'}`}
                    style={active ? { background: meta.color } : undefined}
                  >
                    {done ? <Check size={15} /> : <span className="w-2 h-2 rounded-full bg-current" />}
                  </span>
                  {idx < STATUS_FLOW.length - 1 && (
                    <span className={`w-0.5 h-6 ${idx < currentIndex ? 'bg-emerald-500' : 'bg-[var(--gray-100)]'}`} />
                  )}
                </div>
                <p className={`pt-1.5 pb-3 text-sm font-semibold m-0 ${active ? 'text-[var(--gray-800)]' : 'text-[var(--gray-400)]'}`}>{statusLabel(status)}</p>
              </li>
            )
          })}
        </ol>
      )}

      {tracked && (
        <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-3.5">
          <h4 className="text-[0.8rem] font-bold text-[var(--gray-600)] m-0 mb-2">{labels.orderSummary}</h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {tracked.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3 text-[0.82rem] text-[var(--gray-600)]">
                <span>{it.quantity}× {it.name}</span>
                <span className="tabular-nums">{money(it.price * it.quantity)} {labels.sum}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--surface-border)] mt-2.5 pt-2.5 flex flex-col gap-1 text-[0.82rem]">
            {tracked.serviceFee > 0 && (
              <>
                <div className="flex justify-between text-[var(--gray-500)]"><span>{labels.subtotal}</span><span className="tabular-nums">{money(tracked.subtotal)} {labels.sum}</span></div>
                <div className="flex justify-between text-[var(--gray-500)]"><span>{labels.serviceFee}</span><span className="tabular-nums">{money(tracked.serviceFee)} {labels.sum}</span></div>
              </>
            )}
            <div className="flex justify-between font-extrabold text-[var(--gray-900)]"><span>{labels.total}</span><span className="tabular-nums">{money(tracked.total)} {labels.sum}</span></div>
          </div>
          {tracked.note && (
            <p className="mt-2.5 rounded-lg bg-[var(--gray-50)] px-2.5 py-2 text-[0.75rem] text-[var(--gray-500)]">{labels.notes}: {tracked.note}</p>
          )}
        </div>
      )}
    </div>
  )
}
