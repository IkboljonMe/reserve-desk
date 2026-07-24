"use client";

import { CreditCard } from "lucide-react";
import { useTranslation } from "@/i18n";
import { money } from "@/lib/bookingHelpers";
import {
  PAYMENT_METHOD_LABEL_KEY,
  PAYMENT_METHOD_COLOR,
} from "@/lib/paymentMethods";
import type { DashboardPageState } from "../useDashboardPage";

// Collected money broken down by payment method for the selected period. Each
// row's bar is the method's share of the total collected.
export function PaymentsByMethodCard({ s }: { s: DashboardPageState }) {
  const { t } = useTranslation();
  const bm = s.byMethod;
  const total = bm.totalCollected;
  const pct = (v: number) => (total > 0 ? `${Math.round((v / total) * 100)}%` : "0%");

  // Only methods that actually took money, plus an "unspecified" bucket when
  // money was collected without a recorded method.
  const rows: { key: string; color: string; label: string; amount: number; count: number }[] = [
    ...bm.rows
      .filter((r) => r.amount > 0)
      .map((r) => ({
        key: r.method,
        color: PAYMENT_METHOD_COLOR[r.method],
        label: t(PAYMENT_METHOD_LABEL_KEY[r.method]),
        amount: r.amount,
        count: r.count,
      })),
    ...(bm.unspecified.amount > 0
      ? [
          {
            key: "unspecified",
            color: "var(--gray-400)",
            label: t("pmUnspecified"),
            amount: bm.unspecified.amount,
            count: bm.unspecified.count,
          },
        ]
      : []),
  ];

  return (
    <div className="card p-[1.1rem_1.25rem]">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex text-brand-600">
          <CreditCard size={17} />
        </span>
        <h3 className="m-0 text-[0.95rem]">{t("paymentsByMethod")}</h3>
        <span className="ml-auto font-[800] text-[1.15rem] text-gray-900 tabular-nums">
          {money(total)}{" "}
          <span className="text-[0.72rem] font-medium text-gray-500">
            {t("sum")}
          </span>
        </span>
      </div>
      <p className="text-[0.72rem] text-gray-400 m-0 mb-[0.9rem]">
        {t("paymentsByMethodHint")}
      </p>

      {rows.length === 0 ? (
        <p className="text-[0.8rem] text-gray-400 m-0">{t("noPaymentsData")}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-3 flex-wrap">
              {/* method */}
              <span className="flex items-center gap-2 text-[0.8rem] text-gray-700 font-semibold w-36 shrink-0 max-[480px]:w-full">
                <span
                  className="w-2.5 h-2.5 shrink-0"
                  style={{ background: r.color }}
                />
                {r.label}
              </span>
              {/* bar */}
              <div className="flex-1 basis-[100px] min-w-20 h-2 bg-gray-100 overflow-hidden">
                <div
                  className="h-full transition-[width] duration-400 ease-out"
                  style={{ width: pct(r.amount), background: r.color }}
                />
              </div>
              {/* share */}
              <span className="w-11 shrink-0 text-right text-[0.78rem] font-bold text-gray-800 tabular-nums">
                {pct(r.amount)}
              </span>
              {/* amount + count */}
              <span className="shrink-0 text-right text-[0.78rem] text-gray-600 tabular-nums max-[480px]:w-full">
                {money(r.amount)} {t("sum")} ·{" "}
                {t("nBookings", { n: r.count })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
