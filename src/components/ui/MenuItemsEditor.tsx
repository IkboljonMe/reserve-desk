"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/i18n";
import Button from "@/components/ui/Button";

export interface MenuItem {
  name: string;
  qty: number;
  price: number;
}

const SERVICE_FEE_RATE = 0.1;
const fmt = (v: number) =>
  String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Optional food/order request attached to a booking (e.g. for a SPA & Pool
// event): a list of priced line items plus a "ready by" time. Subtotal /
// service fee / total mirror exactly what the Telegram message shows
// (src/lib/telegram.ts › SERVICE_FEE_RATE must stay in sync with this one).
export function MenuItemsEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
  readyTime,
  onReadyTimeChange,
}: {
  items: MenuItem[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<MenuItem>) => void;
  onRemove: (index: number) => void;
  readyTime: string;
  onReadyTimeChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + fee;

  return (
    <div>
      <label className="form-label block mb-2">{t("menuOptional")}</label>

      {items.length > 0 && (
        <div className="flex gap-1.5 mb-1 px-0.5 text-[0.68rem] font-bold text-(--gray-400) uppercase tracking-[0.03em]">
          <span className="flex-1">{t("menuItemName")}</span>
          <span className="w-14 text-center">{t("menuItemQty")}</span>
          <span className="w-25 text-right">{t("menuItemPrice")}</span>
          <span className="w-7" />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              className="form-input flex-1 px-2 py-1.5 text-[0.82rem]"
              placeholder={t("menuPlaceholder")}
              value={item.name}
              onChange={(e) => onUpdate(i, { name: e.target.value })}
            />
            <input
              type="number"
              min={1}
              step={1}
              className="form-input w-14 px-1 py-1.5 text-[0.82rem] text-center"
              value={item.qty}
              onChange={(e) =>
                onUpdate(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })
              }
              onFocus={(e) => e.currentTarget.select()}
            />
            <input
              type="text"
              inputMode="numeric"
              className="form-input w-25 px-2 py-1.5 text-[0.82rem] text-right"
              value={item.price ? fmt(item.price) : ""}
              placeholder="0"
              onChange={(e) =>
                onUpdate(i, {
                  price: Number(e.target.value.replace(/\D/g, "")) || 0,
                })
              }
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="ghost"
              icon
              className="w-7 shrink-0"
              onClick={() => onRemove(i)}
              aria-label={t("delete")}
            >
              <Trash2 size={14} color="var(--danger)" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-2 inline-flex items-center gap-1.5"
        onClick={onAdd}
      >
        <Plus size={13} /> {t("addMenuItem")}
      </Button>

      {items.length > 0 && (
        <div className="mt-2.5 px-2.5 py-2 rounded-lg bg-(--gray-50) border border-(--gray-200) text-[0.78rem] text-(--gray-600) flex flex-col gap-0.75">
          <div className="flex justify-between">
            <span>{t("menuSubtotal")}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("menuServiceFee")}</span>
            <span>{fmt(fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-(--gray-800)">
            <span>{t("menuTotal")}</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      )}

      <div className="mt-2.5 max-w-40">
        <label className="form-label">{t("menuReadyTime")}</label>
        <input
          type="time"
          className="form-input"
          value={readyTime}
          onChange={(e) => onReadyTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}
