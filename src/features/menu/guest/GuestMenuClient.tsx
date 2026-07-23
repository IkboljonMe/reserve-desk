"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Minus,
  ShoppingBag,
  UtensilsCrossed,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import {
  localized,
  computeServiceFee,
  guestHubPath,
  MENU_LANG_OPTIONS,
} from "@/lib/menu";
import { money } from "@/lib/bookingHelpers";
import { useGuestPrefs } from "./useGuestPrefs";
import { RecommendationBanner } from "./RecommendationBanner";
import { OrderTracker } from "./OrderTracker";
import type { MenuCategory, MenuProduct } from "../types";
import type { GuestLabels, TrackedOrder } from "./menuTypes";

// Re-exported so server pages can keep importing the labels type from here.
export type { GuestLabels } from "./menuTypes";

const FIELD =
  "w-full px-3 py-2 min-h-10.5 rounded-lg text-sm outline-none bg-(--surface-card) border border-(--surface-border) text-(--gray-800) focus:border-(--brand-500) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]";

export function GuestMenuClient({
  labels,
  locale,
  hotelName,
  hotelSlug,
  room,
  categories,
  products,
  recommendations = [],
  serviceFeeType,
  serviceFeeValue,
  isMenuSub = false,
}: {
  labels: GuestLabels;
  locale: string;
  hotelName: string;
  hotelSlug: string;
  room: string;
  categories: MenuCategory[];
  products: MenuProduct[];
  recommendations?: MenuProduct[];
  serviceFeeType: "none" | "percent" | "fixed";
  serviceFeeValue: number;
  isMenuSub?: boolean;
}) {
  const cartKey = `bronit-menu-cart:${hotelSlug}:${room || "guest"}`;
  // The menu's food/category text can be shown in any of the 10 content
  // languages, independent of the page chrome's locale (uz/ru/en, ?locale) —
  // shared with the hub page via useGuestPrefs (same localStorage keys), so a
  // guest's language/theme choice carries across both.
  const {
    lang: contentLang,
    setLang: setContentLang,
    theme,
    toggleTheme,
    themeVars,
  } = useGuestPrefs(locale);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState(room);
  const [guestName, setGuestName] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(
    null,
  );
  const [tracked, setTracked] = useState<TrackedOrder | null>(null);
  const [trackLoading, setTrackLoading] = useState(true);
  const [error, setError] = useState("");

  // Load any cart the guest left behind (e.g. tab closed mid-browse), scoped to
  // this hotel+room so two rooms on the same device don't share a basket.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [cartKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {
      /* storage full / unavailable */
    }
  }, [cart, hydrated, cartKey]);

  // Poll the placed order's status so the guest sees it move pending → … → delivered.
  useEffect(() => {
    if (!placed) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/menu/guest/order/${placed.id}?hotel=${encodeURIComponent(hotelSlug)}`,
          { cache: "no-store" },
        );
        if (res.ok && alive) setTracked(await res.json());
      } catch {
        /* keep last known state */
      } finally {
        if (alive) setTrackLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [placed, hotelSlug]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p._id, p])),
    [products],
  );
  const setQty = (id: string, qty: number) =>
    setCart((c) => {
      const n = { ...c };
      if (qty <= 0) delete n[id];
      else n[id] = qty;
      return n;
    });

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ p: productById.get(id), qty }))
    .filter((l): l is { p: MenuProduct; qty: number } => !!l.p);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const fee = computeServiceFee(subtotal, serviceFeeType, serviceFeeValue);
  const total = subtotal + fee;

  const byCategory = (cid: string) =>
    products.filter((p) => p.categoryId === cid && p.available);

  async function placeOrder() {
    if (!roomNumber.trim()) {
      setError(labels.roomRequiredError);
      return;
    }
    if (count === 0) return;
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/menu/guest/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel: hotelSlug,
          room: roomNumber.trim(),
          guestName,
          note,
          items: lines.map((l) => ({ productId: l.p._id, quantity: l.qty })),
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setPlaced({
        id: data.id,
        total: typeof data.total === "number" ? data.total : total,
      });
      setTracked(null);
      setTrackLoading(true);
      setCart({});
      setNote("");
    } catch {
      setError(labels.orderFailed);
    } finally {
      setPlacing(false);
    }
  }

  function closeCart() {
    setCartOpen(false);
    setPlaced(null);
    setTracked(null);
  }

  function Stepper({ id }: { id: string }) {
    const qty = cart[id] || 0;
    if (qty === 0) {
      return (
        <button
          onClick={() => setQty(id, 1)}
          className="w-8 h-8 rounded-full bg-(--brand-500) text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          aria-label={labels.add}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      );
    }
    return (
      <div className="flex items-center gap-1.5 bg-(--surface-bg) rounded-full p-1 border border-(--surface-border)">
        <button
          onClick={() => setQty(id, qty - 1)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-(--gray-700) bg-white shadow-sm active:scale-95"
          aria-label="−"
        >
          <Minus size={14} />
        </button>
        <span className="w-4 text-center font-bold tabular-nums text-[0.8rem]">
          {qty}
        </span>
        <button
          onClick={() => setQty(id, qty + 1)}
          className="w-6 h-6 rounded-full bg-(--brand-500) text-white flex items-center justify-center shadow-sm active:scale-95"
          aria-label="+"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-(--surface-bg) text-(--gray-900) pb-24"
      style={themeVars}
    >
      {/* items-stretch throughout so every control matches whatever height the
          Dropdown (a shared, fixed-internal-padding component) actually
          renders at, instead of guessing a px value that has to stay in sync
          with it. */}
      <header className="sticky top-0 z-10 max-w-md mx-auto bg-(--surface-card) border-b border-(--surface-border) flex flex-col shadow-sm">
        <div className="px-4 py-3 flex items-stretch justify-between gap-3">
          <div className="min-w-0 flex items-stretch gap-2.5">
            <a
              href={guestHubPath(locale, hotelSlug, room, isMenuSub)}
              aria-label={labels.backToMenu}
              className="w-10 rounded-lg bg-(--gray-100) text-(--gray-700) flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={16} />
            </a>
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-[1.05rem] font-extrabold truncate m-0">
                {hotelName}
              </h1>
              {room && (
                <p className="text-[0.8rem] text-(--gray-500) m-0 mt-0.5">
                  {labels.room} {room}
                </p>
              )}
            </div>
          </div>
          <nav className="flex items-stretch gap-1.5 shrink-0">
            <div className="w-29.5">
              <Dropdown
                value={contentLang}
                onChange={(v) => setContentLang(v as typeof contentLang)}
                options={MENU_LANG_OPTIONS}
                ariaLabel="Menu language"
              />
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 rounded-lg bg-(--gray-100) text-(--gray-700) flex items-center justify-center shrink-0"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </nav>
        </div>

        {/* Category Nav */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            if (byCategory(cat._id).length === 0) return null;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(`cat-${cat._id}`);
                  if (el) {
                    const y =
                      el.getBoundingClientRect().top + window.scrollY - 130;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }
                }}
                className="whitespace-nowrap px-4 py-1.5 rounded-full bg-(--gray-100) text-(--gray-700) text-[0.85rem] font-bold active:scale-95 transition-transform shrink-0"
              >
                {localized(cat.nameI18n, cat.name, contentLang)}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-6">
        <RecommendationBanner
          items={recommendations}
          contentLang={contentLang}
          labels={labels}
          onAdd={(p) => setQty(p._id, (cart[p._id] || 0) + 1)}
        />
        {categories.every((c) => byCategory(c._id).length === 0) ? (
          <p className="text-center text-(--gray-400) text-sm py-16">
            {labels.menuEmpty}
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {categories.map((cat) => {
              const prods = byCategory(cat._id);
              if (prods.length === 0) return null;
              return (
                <section
                  key={cat._id}
                  id={`cat-${cat._id}`}
                  className="scroll-mt-32.5"
                >
                  <h2 className="text-[1.1rem] font-extrabold mb-3 text-(--gray-800) px-1">
                    {localized(cat.nameI18n, cat.name, contentLang)}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {prods.map((p) => {
                      const name = localized(p.nameI18n, p.name, contentLang);
                      const desc = localized(
                        p.descI18n,
                        p.description,
                        contentLang,
                      );
                      return (
                        <div
                          key={p._id}
                          className="bg-(--surface-card) border border-(--surface-border) rounded-2xl overflow-hidden shadow-sm flex flex-col"
                        >
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 bg-(--gray-100) flex items-center justify-center text-(--gray-300)">
                              <UtensilsCrossed size={32} />
                            </div>
                          )}
                          <div className="p-2.5 flex flex-col flex-1">
                            <div className="font-bold text-[0.88rem] text-(--gray-800) leading-tight">
                              {name}
                            </div>
                            {desc && (
                              <p className="text-[0.72rem] text-(--gray-500) mt-1 leading-snug line-clamp-2">
                                {desc}
                              </p>
                            )}
                            <div className="mt-auto pt-3 flex items-end justify-between gap-1">
                              <div className="font-extrabold text-[0.85rem] text-(--brand-600) tabular-nums leading-none pb-1">
                                {money(p.price)}
                              </div>
                              <div className="shrink-0">
                                <Stepper id={p._id} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky cart bar */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-3 bg-linear-to-t from-(--surface-bg) to-transparent">
          <button
            onClick={() => {
              setError("");
              setCartOpen(true);
            }}
            className="max-w-md mx-auto w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-(--brand-500) text-white font-bold shadow-lg"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag size={18} />{" "}
              {labels.itemsN.replace("{n}", String(count))}
            </span>
            <span className="tabular-nums">
              {labels.viewOrder} · {money(total)} {labels.sum}
            </span>
          </button>
        </div>
      )}

      <Modal
        open={cartOpen}
        onClose={closeCart}
        title={placed ? labels.orderPlaced : labels.yourOrder}
        size="sm"
        closeLabel={labels.close}
        footer={
          placed ? (
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={closeCart}
            >
              {labels.backToMenu}
            </Button>
          ) : (
            <Button
              className="w-full justify-center"
              loading={placing}
              disabled={count === 0}
              onClick={placeOrder}
            >
              {placing
                ? labels.placingOrder
                : `${labels.placeOrder} · ${money(total)} ${labels.sum}`}
            </Button>
          )
        }
      >
        {placed ? (
          <OrderTracker
            placed={placed}
            tracked={tracked}
            loading={trackLoading}
            labels={labels}
            hotelSlug={hotelSlug}
            room={roomNumber}
          />
        ) : count === 0 ? (
          <p className="text-center text-(--gray-400) py-10">
            {labels.emptyCart}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
              {lines.map((l) => (
                <li key={l.p._id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[0.9rem] text-(--gray-800) truncate">
                      {localized(l.p.nameI18n, l.p.name, contentLang)}
                    </div>
                    <div className="text-[0.78rem] text-(--gray-500) tabular-nums">
                      {money(l.p.price)} {labels.sum}
                    </div>
                  </div>
                  <Stepper id={l.p._id} />
                  <div className="w-20 text-right font-bold text-[0.88rem] tabular-nums shrink-0">
                    {money(l.p.price * l.qty)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-(--surface-border) pt-3 flex flex-col gap-1.5 text-[0.85rem]">
              <div className="flex justify-between text-(--gray-600)">
                <span>{labels.subtotal}</span>
                <span className="tabular-nums">
                  {money(subtotal)} {labels.sum}
                </span>
              </div>
              {fee > 0 && (
                <div className="flex justify-between text-(--gray-600)">
                  <span>{labels.serviceFee}</span>
                  <span className="tabular-nums">
                    {money(fee)} {labels.sum}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-(--gray-900) text-[0.95rem]">
                <span>{labels.total}</span>
                <span className="tabular-nums">
                  {money(total)} {labels.sum}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <input
                className={FIELD}
                inputMode="numeric"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder={labels.roomNumber}
              />
              <input
                className={FIELD}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={labels.guestNamePlaceholder}
              />
              <textarea
                className={`${FIELD} resize-y min-h-14`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={labels.orderNotePlaceholder}
              />
              {error && (
                <p className="text-[0.8rem] text-(--color-danger) font-medium m-0">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
