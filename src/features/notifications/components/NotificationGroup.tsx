"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n";
import Spinner from "@/components/ui/Spinner";
import { ContractNotification, NotificationTier } from "@/types";
import { TIER_META } from "../constants";
import { fmtDate } from "../utils";
import Button from "@/components/ui/Button";

export function NotificationGroup({
  tier,
  list,
  dismissing,
  onDismiss,
}: {
  tier: NotificationTier;
  list: ContractNotification[];
  dismissing: string | null;
  onDismiss: (n: ContractNotification) => void;
}) {
  const { t, lang } = useTranslation();
  const meta = TIER_META[tier];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="inline-flex w-5.5 h-5.5 items-center justify-center"
          style={{ color: meta.color }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {meta.icon}
          </svg>
        </span>
        <span
          className="text-[0.75rem] font-bold tracking-wider uppercase"
          style={{ color: meta.color }}
        >
          {t(meta.labelKey)}
        </span>
        <span className="text-[0.72rem] font-bold text-[var(--gray-400)] bg-[var(--gray-100,#f3f4f6)] rounded-full px-2 py-0.5">
          {list.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {list.map((n) => {
          const key = n.contractId + ":" + n.threshold;
          return (
            <div
              key={key}
              className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm p-[1rem_1.1rem] flex items-start gap-3.5 border-l-3"
              style={{ borderLeftColor: meta.color, background: meta.bg }}
            >
              <div
                className="w-9.5 h-9.5 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-[var(--shadow-xs)]"
                style={{ color: meta.color }}
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {meta.icon}
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-[--gray-800] text-[0.9rem]">
                  {n.title}
                </div>
                <div className="text-[--gray-600] text-[0.83rem] mt-0.5">
                  {n.message}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[0.75rem] text-[var(--gray-500)]">
                  {n.contractNumber && (
                    <span className="font-semibold text-[--gray-600]">
                      № {n.contractNumber}
                    </span>
                  )}
                  <span>
                    {t("finishColon", { date: fmtDate(n.finishDate) })}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 shrink-0">
                <Link
                  href={`/${lang}/contracts`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--gray-200,#e5e7eb)] bg-white py-1.5 px-3 text-[0.8125rem] font-semibold text-[var(--gray-700)] whitespace-nowrap tracking-tight shadow-sm transition-colors duration-150 hover:bg-[var(--gray-50,#f9fafb)] hover:border-[var(--gray-300)]"
                >
                  {t("view")}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(n)}
                  disabled={dismissing === key}
                >
                  {dismissing === key ? <Spinner size={18} /> : t("dismiss")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
