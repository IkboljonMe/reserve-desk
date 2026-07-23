"use client";

import React from "react";
import { Service, money } from "@/lib/bookingHelpers";
import { useCountUp } from "@/hooks/useCountUp";
import { useTranslation } from "@/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import DashboardKpi from "./DashboardKpi";
import IncomeChart from "./IncomeChart";

interface IncomeAnalyticsProps {
  analytics: {
    data: {
      label: string;
      expected: number;
      collected: number;
      count: number;
    }[];
    byWeek: boolean;
    total: number;
    collected: number;
    due: number;
    count: number;
  };
  loading: boolean;
  perService: { svc: Service; total: number }[];
}

const INK_COLLECTED = "#059669"; // darker green for ink/stroke (contrast relief)
const FILL_COLLECTED = "#10b981"; // green fill
const EXPECTED = "#6366f1"; // indigo (brand)

export default function IncomeAnalytics({
  analytics,
  loading,
  perService,
}: IncomeAnalyticsProps) {
  const { t } = useTranslation();
  const total = useCountUp(analytics.total);
  const collected = useCountUp(analytics.collected);
  const due = useCountUp(analytics.due);
  const count = useCountUp(analytics.count);

  return (
    // Single column on mobile (KPIs + chart, then per-service bars on the next
    // line); two columns — chart left, per-service breakdown right — from 861px.
    // NB: keep this as classes, not an inline gridTemplateColumns style, or the
    // inline value overrides the responsive collapse and squeezes mobile.
    <div className="grid gap-6 grid-cols-1 min-[861px]:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">
        {/* KPI strip — 2×2 grid on mobile, inline row on larger screens */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:gap-5.5 sm:flex-wrap mb-[1.1rem]">
          <DashboardKpi
            label={t("totalIncome")}
            value={`${money(total)}`}
            unit={t("sum")}
            color="var(--gray-900)"
          />
          <DashboardKpi
            label={t("collected")}
            value={`${money(collected)}`}
            unit={t("sum")}
            color={INK_COLLECTED}
            dot={FILL_COLLECTED}
          />
          <DashboardKpi
            label={t("outstanding")}
            value={`${money(due)}`}
            unit={t("sum")}
            color="#b45309"
            dot="#f59e0b"
          />
          <DashboardKpi
            label={t("bookings")}
            value={`${Math.round(count)}`}
            color={EXPECTED}
          />
        </div>
        {/* Chart */}
        {loading ? (
          <Skeleton style={{ height: 200 }} />
        ) : (
          <IncomeChart
            key={`${analytics.data.length}-${analytics.total}`}
            data={analytics.data}
          />
        )}
        {/* Legend */}
        <div className="flex gap-4 mt-3 text-[0.72rem] text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3"
              style={{ background: FILL_COLLECTED }}
            />{" "}
            {t("collected")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3"
              style={{
                background: `${EXPECTED}33`,
                border: `1.5px solid ${EXPECTED}`,
              }}
            />{" "}
            {t("expectedBooked")}
          </span>
        </div>
      </div>

      {/* Income by service */}
      <div className="border-l border-surface-border pl-[1.4rem] max-[860px]:border-l-0 max-[860px]:border-t max-[860px]:border-surface-border max-[860px]:pl-0 max-[860px]:pt-[1.1rem]">
        <h3 className="text-[0.8rem] m-0 mb-[0.9rem]">
          {t("incomeByService")}
        </h3>
        {perService.length === 0 ? (
          <p className="text-[0.78rem] text-gray-400">
            {t("noIncomeInPeriod")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {perService.slice(0, 6).map(({ svc, total: svcTotal }) => {
              const pct =
                analytics.total > 0 ? (svcTotal / analytics.total) * 100 : 0;
              return (
                <div key={svc._id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[0.78rem] text-gray-700 overflow-hidden">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: svc.color }}
                      />
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {svc.name}
                      </span>
                    </span>
                    <span className="text-[0.72rem] font-bold text-gray-500 tabular-nums">
                      {money(svcTotal)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        background: svc.color,
                        width: `${pct}%`,
                        transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
