"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Plus, UtensilsCrossed } from "lucide-react";
import { localized } from "@/lib/menu";
import { money } from "@/lib/bookingHelpers";
import type { MenuProduct } from "../types";
import type { GuestLabels } from "./menuTypes";

// Auto-advancing carousel of the day's recommended products on the guest menu.
// Renders nothing when there are no recommendations.
export function RecommendationBanner({
  items,
  contentLang,
  labels,
  onAdd,
}: {
  items: MenuProduct[];
  contentLang: string;
  labels: GuestLabels;
  onAdd: (product: MenuProduct) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const next = (active + 1) % items.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(timer);
  }, [active, items.length]);

  if (items.length === 0) return null;

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx !== active) setActive(idx);
  }

  return (
    <section>
      <div className="flex items-center gap-1.5 text-(--brand-600) mb-2">
        <Sparkles size={14} />
        <h2 className="text-[0.75rem] font-bold uppercase tracking-wide m-0">
          {labels.recommendedToday}
        </h2>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => {
          const name = localized(p.nameI18n, p.name, contentLang);
          const desc = localized(p.descI18n, p.description, contentLang);
          return (
            <div
              key={p._id}
              className="relative h-36 w-full shrink-0 snap-center overflow-hidden"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary hotel-supplied URLs
                <img
                  src={p.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-(--gray-100) text-(--gray-400)">
                  <UtensilsCrossed size={30} />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-white text-[1.05rem] m-0">
                    {name}
                  </h3>
                  {desc && (
                    <p className="truncate text-white/70 text-[0.72rem] mt-0.5 m-0">
                      {desc}
                    </p>
                  )}
                  <div className="font-bold text-white text-[0.85rem] mt-1 tabular-nums">
                    {money(p.price)} {labels.sum}
                  </div>
                </div>
                <button
                  onClick={() => onAdd(p)}
                  className="w-9 h-9 rounded-full bg-(--brand-500) text-white flex items-center justify-center shrink-0"
                  aria-label={labels.add}
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((p, i) => (
            <span
              key={p._id}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-(--brand-500)" : "w-1.5 bg-(--gray-200)"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
