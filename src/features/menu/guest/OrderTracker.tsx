"use client";

import { Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { money } from "@/lib/bookingHelpers";
import { ORDER_STATUS_META, STATUS_FLOW } from "../constants";
import type { OrderStatus } from "../types";
import { GuestReviewForm } from "./GuestReviewForm";
import type { GuestLabels, TrackedOrder } from "./menuTypes";

// The post-order confirmation view: status stepper, order summary, and the
// optional feedback form. Polling lives in the parent; this only renders state.
export function OrderTracker({
  placed,
  tracked,
  loading,
  labels,
  hotelSlug,
  room,
}: {
  placed: { id: string; total: number };
  tracked: TrackedOrder | null;
  loading: boolean;
  labels: GuestLabels;
  hotelSlug: string;
  room: string;
}) {
  const statusLabel = (s: OrderStatus): string =>
    (
      ({
        pending: labels.orderPending,
        preparing: labels.orderPreparing,
        ready: labels.orderReady,
        delivered: labels.orderDelivered,
      }) as Record<string, string>
    )[s] ?? s;
  const currentIndex = tracked ? STATUS_FLOW.indexOf(tracked.status) : -1;
  const cancelled = tracked?.status === "cancelled";

  return (
    <div className="flex flex-col gap-5 py-1">
      <div className="flex flex-col items-center text-center gap-2.5">
        <span className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
          <Check size={30} />
        </span>
        <h3 className="font-extrabold text-[1.1rem] m-0">
          {labels.orderPlaced}
        </h3>
        <p className="text-(--gray-500) text-sm m-0">
          {labels.orderPlacedDesc}
        </p>
        <p className="text-[0.78rem] text-(--gray-400) m-0">
          {labels.orderNo} #{placed.id.slice(-6).toUpperCase()}
        </p>
      </div>

      {!tracked ? (
        loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <p className="text-center text-(--gray-400) text-sm py-6">
            {labels.couldNotLoad}
          </p>
        )
      ) : cancelled ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="font-bold m-0 text-(--color-danger)">
            {labels.cancelledTitle}
          </p>
          <p className="text-sm mt-1 m-0 text-[--gray-600]">
            {labels.cancelledSub}
          </p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {STATUS_FLOW.map((status, idx) => {
            const done = idx < currentIndex;
            const active = idx === currentIndex;
            const meta = ORDER_STATUS_META[status];
            return (
              <li key={status} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 text-white" : !active ? "bg-(--gray-100) text-(--gray-400)" : "text-white"}`}
                    style={active ? { background: meta.color } : undefined}
                  >
                    {done ? (
                      <Check size={15} />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </span>
                  {idx < STATUS_FLOW.length - 1 && (
                    <span
                      className={`w-0.5 h-6 ${idx < currentIndex ? "bg-emerald-500" : "bg-(--gray-100)"}`}
                    />
                  )}
                </div>
                <p
                  className={`pt-1.5 pb-3 text-sm font-semibold m-0 ${active ? "text-[--gray-800]" : "text-(--gray-400)"}`}
                >
                  {statusLabel(status)}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {tracked && (
        <div className="rounded-xl border border-(--surface-border) bg-(--surface-card) p-3.5">
          <h4 className="text-[0.8rem] font-bold text-[--gray-600] m-0 mb-2">
            {labels.orderSummary}
          </h4>
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {tracked.items.map((it, i) => (
              <li
                key={i}
                className="flex justify-between gap-3 text-[0.82rem] text-[--gray-600]"
              >
                <span>
                  {it.quantity}× {it.name}
                </span>
                <span className="tabular-nums">
                  {money(it.price * it.quantity)} {labels.sum}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-(--surface-border) mt-2.5 pt-2.5 flex flex-col gap-1 text-[0.82rem]">
            {tracked.serviceFee > 0 && (
              <>
                <div className="flex justify-between text-(--gray-500)">
                  <span>{labels.subtotal}</span>
                  <span className="tabular-nums">
                    {money(tracked.subtotal)} {labels.sum}
                  </span>
                </div>
                <div className="flex justify-between text-(--gray-500)">
                  <span>{labels.serviceFee}</span>
                  <span className="tabular-nums">
                    {money(tracked.serviceFee)} {labels.sum}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between font-extrabold text-[--gray-900]">
              <span>{labels.total}</span>
              <span className="tabular-nums">
                {money(tracked.total)} {labels.sum}
              </span>
            </div>
          </div>
          {tracked.note && (
            <p className="mt-2.5 rounded-lg bg-(--gray-50) px-2.5 py-2 text-[0.75rem] text-(--gray-500)">
              {labels.notes}: {tracked.note}
            </p>
          )}
        </div>
      )}

      {tracked && !cancelled && (
        <GuestReviewForm
          hotelSlug={hotelSlug}
          orderId={placed.id}
          room={room}
          labels={{
            reviewTitle: labels.reviewTitle,
            reviewCommentPlaceholder: labels.reviewCommentPlaceholder,
            reviewSubmit: labels.reviewSubmit,
            reviewThanks: labels.reviewThanks,
          }}
        />
      )}
    </div>
  );
}
