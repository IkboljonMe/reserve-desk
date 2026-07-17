'use client'

import { useMemo, useState } from 'react'
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { localized, computeServiceFee } from '@/lib/menu'
import { money } from '@/lib/bookingHelpers'
import type { MenuCategory, MenuProduct } from '../types'

export interface GuestLabels {
  room: string; sum: string; menuEmpty: string; add: string; total: string; close: string; cancel: string
  yourOrder: string; viewOrder: string; placeOrder: string; placingOrder: string
  orderPlaced: string; orderPlacedDesc: string; emptyCart: string
  subtotal: string; serviceFee: string; roomNumber: string
  guestNamePlaceholder: string; orderNotePlaceholder: string
  orderFailed: string; roomRequiredError: string; itemsN: (n: number) => string
}

const LOCALES = ['uz', 'ru', 'en'] as const
const FIELD = 'w-full px-3 py-2 min-h-[42px] rounded-lg text-sm outline-none bg-[var(--surface-card)] border border-[var(--surface-border)] text-[var(--gray-800)] focus:border-[var(--brand-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]'

export function GuestMenuClient({
  labels, locale, hotelName, hotelSlug, room, categories, products, serviceFeeType, serviceFeeValue,
}: {
  labels: GuestLabels
  locale: string
  hotelName: string
  hotelSlug: string
  room: string
  categories: MenuCategory[]
  products: MenuProduct[]
  serviceFeeType: 'none' | 'percent' | 'fixed'
  serviceFeeValue: number
}) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [roomNumber, setRoomNumber] = useState(room)
  const [guestName, setGuestName] = useState('')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState<{ total: number } | null>(null)
  const [error, setError] = useState('')

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

  const query = `hotel=${encodeURIComponent(hotelSlug)}${room ? `&room=${encodeURIComponent(room)}` : ''}`
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
      setPlaced({ total: typeof data.total === 'number' ? data.total : total })
      setCart({}); setNote('')
    } catch {
      setError(labels.orderFailed)
    } finally {
      setPlacing(false)
    }
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
      <header className="sticky top-0 z-10 bg-[var(--surface-card)] border-b border-[var(--surface-border)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.05rem] font-extrabold truncate m-0">{hotelName}</h1>
          {room && <p className="text-[0.8rem] text-[var(--gray-500)] m-0 mt-0.5">{labels.room} {room}</p>}
        </div>
        <nav className="flex items-center gap-1 shrink-0">
          {LOCALES.map(l => (
            <a key={l} href={`/${l}/menu?${query}`} className={`px-2 py-1 rounded-md text-[0.75rem] font-bold uppercase ${l === locale ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--gray-500)] hover:bg-[var(--gray-100)]'}`}>{l}</a>
          ))}
        </nav>
      </header>

      <main className="max-w-[680px] mx-auto px-4 py-5 flex flex-col gap-6">
        {categories.every(c => byCategory(c._id).length === 0) ? (
          <p className="text-center text-[var(--gray-400)] text-sm py-16">{labels.menuEmpty}</p>
        ) : (
          categories.map(cat => {
            const prods = byCategory(cat._id)
            if (prods.length === 0) return null
            return (
              <section key={cat._id}>
                <h2 className="text-[1.1rem] font-bold mb-3 text-[var(--gray-800)]">{localized(cat.nameI18n, cat.name, locale)}</h2>
                <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                  {prods.map(p => {
                    const name = localized(p.nameI18n, p.name, locale)
                    const desc = localized(p.descI18n, p.description, locale)
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
            className="max-w-[680px] mx-auto w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-[var(--brand-500)] text-white font-bold shadow-lg"
          >
            <span className="inline-flex items-center gap-2"><ShoppingBag size={18} /> {labels.itemsN(count)}</span>
            <span className="tabular-nums">{labels.viewOrder} · {money(total)} {labels.sum}</span>
          </button>
        </div>
      )}

      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={placed ? labels.orderPlaced : labels.yourOrder}
        size="sm"
        closeLabel={labels.close}
        footer={placed ? undefined : (
          <Button className="w-full justify-center" loading={placing} disabled={count === 0} onClick={placeOrder}>
            {placing ? labels.placingOrder : `${labels.placeOrder} · ${money(total)} ${labels.sum}`}
          </Button>
        )}
      >
        {placed ? (
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <span className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center"><Check size={30} /></span>
            <h3 className="font-extrabold text-[1.1rem] m-0">{labels.orderPlaced}</h3>
            <p className="text-[var(--gray-500)] text-sm m-0">{labels.orderPlacedDesc}</p>
            <div className="font-extrabold text-[var(--gray-800)]">{money(placed.total)} {labels.sum}</div>
            <Button variant="secondary" className="mt-2" onClick={() => { setPlaced(null); setCartOpen(false) }}>{labels.close}</Button>
          </div>
        ) : count === 0 ? (
          <p className="text-center text-[var(--gray-400)] py-10">{labels.emptyCart}</p>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {lines.map(l => (
                <li key={l.p._id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[0.9rem] text-[var(--gray-800)] truncate">{localized(l.p.nameI18n, l.p.name, locale)}</div>
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
