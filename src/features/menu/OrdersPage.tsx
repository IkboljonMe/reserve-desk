"use client";

import { format } from "date-fns";
import { RefreshCw, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "@/i18n";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { money } from "@/lib/bookingHelpers";
import { useOrdersPage } from "./useOrdersPage";
import { ORDER_STATUS_META, nextStatus, ADVANCE_LABEL_KEY } from "./constants";
import type { OrderStatus } from "./types";

const CARD =
  "bg-(--surface-card) border border-(--surface-border) rounded-[var(--radius-lg)] shadow-sm";

export default function OrdersPage() {
  const { t } = useTranslation();
  const s = useOrdersPage();

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    { value: "pending", label: t("orderPending") },
    { value: "preparing", label: t("orderPreparing") },
    { value: "ready", label: t("orderReady") },
    { value: "delivered", label: t("orderDelivered") },
    { value: "cancelled", label: t("orderCancelled") },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1>{t("orders")}</h1>
          <p className="mt-1">{t("ordersSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {s.hotels.length > 1 && (
            <div className="w-45">
              <Dropdown
                value={s.hotelId}
                onChange={s.setHotelId}
                options={[
                  { value: "", label: t("allHotels") },
                  ...s.hotels.map((h) => ({ value: h._id, label: h.name })),
                ]}
                ariaLabel={t("hotel")}
              />
            </div>
          )}
          <div className="w-37.5">
            <Dropdown
              value={s.status}
              onChange={s.setStatus}
              options={statusOptions}
              ariaLabel={t("status")}
            />
          </div>
          <Button
            variant="secondary"
            icon
            onClick={s.reload}
            aria-label={t("refresh")}
            title={t("refresh")}
          >
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>

      {s.loading ? (
        <p className="text-(--gray-400) text-sm">{t("loading")}</p>
      ) : s.orders.length === 0 ? (
        <div
          className={`${CARD} p-10 flex flex-col items-center text-center gap-2`}
        >
          <UtensilsCrossed size={26} className="text-(--gray-400)" />
          <h3 className="text-(--gray-700) font-bold">{t("noOrdersYet")}</h3>
          <p className="text-[--gray-500] text-sm">{t("noOrdersDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {s.orders.map((o) => {
            const meta = ORDER_STATUS_META[o.status];
            const next = nextStatus(o.status);
            const advanceKey = ADVANCE_LABEL_KEY[o.status];
            const canCancel =
              o.status !== "delivered" && o.status !== "cancelled";
            return (
              <div key={o._id} className={`${CARD} p-4 flex flex-col gap-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[1.05rem] font-extrabold text-[--gray-800] leading-none">
                      {t("room")} {o.roomNumber}
                    </div>
                    <div className="text-[0.72rem] text-(--gray-400) mt-1">
                      {format(new Date(o.createdAt), "HH:mm")}
                      {o.guestName ? ` · ${o.guestName}` : ""}
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[0.72rem] whitespace-nowrap shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {t(meta.labelKey)}
                  </span>
                </div>

                <ul className="list-none m-0 p-0 flex flex-col gap-1">
                  {o.items.map((it, i) => (
                    <li
                      key={i}
                      className="flex justify-between gap-2 text-[0.85rem]"
                    >
                      <span className="text-(--gray-700) truncate">
                        <span className="font-bold">{it.quantity}×</span>{" "}
                        {it.name}
                      </span>
                      <span className="text-[--gray-500] tabular-nums whitespace-nowrap">
                        {money(it.price * it.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                {o.note && (
                  <p className="text-[0.78rem] text-[--gray-500] italic border-l-2 border-(--surface-border) pl-2">
                    {o.note}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-(--surface-border) pt-2.5">
                  <span className="text-[0.72rem] text-(--gray-400) uppercase tracking-wide">
                    {t("total")}
                  </span>
                  <span className="text-[0.95rem] font-extrabold text-[--gray-800] tabular-nums">
                    {money(o.total)} {t("sum")}
                  </span>
                </div>

                {(next || canCancel) && (
                  <div className="flex gap-2">
                    {next && advanceKey && (
                      <Button
                        size="sm"
                        className="flex-1 justify-center"
                        onClick={() =>
                          s.setStatusFor(o._id, next as OrderStatus)
                        }
                      >
                        {t(advanceKey)}
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => s.setStatusFor(o._id, "cancelled")}
                      >
                        {t("cancel")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
