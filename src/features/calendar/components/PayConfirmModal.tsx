"use client";

import { useState } from "react";
import { Check, Wallet } from "lucide-react";
import { money, amountCollected, amountDue } from "@/lib/bookingHelpers";
import { useTranslation } from "@/i18n";
import type { CalendarPageState } from "../useCalendarPage";
import Button from "@/components/ui/Button";

export function PayConfirmModal({ s }: { s: CalendarPageState }) {
  const { t } = useTranslation();
  const { payConfirm, setPayConfirm, recordPayment } = s;

  const total = payConfirm?.totalPrice || 0;
  const collected = payConfirm ? amountCollected(payConfirm) : 0;
  const due = payConfirm ? amountDue(payConfirm) : 0;
  // "Amount received now" — defaults to the full remaining balance.
  const [received, setReceived] = useState("");
  if (!payConfirm) return null;

  const receivedNum =
    received === "" ? due : Math.max(0, Math.min(due, Number(received) || 0));
  const newTotal = collected + receivedNum;
  const settlesFully = total > 0 && newTotal >= total;

  const close = () => {
    setPayConfirm(null);
    setReceived("");
  };

  return (
    <div className="modal-overlay z-2000" onClick={close}>
      <div className="modal max-w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center gap-3">
          <span className="w-13 h-13 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Wallet size={24} />
          </span>
          <h2 className="m-0 text-[1.1rem]">{t("confirmPayment")}</h2>
          <p className="m-0 text-[--gray-600] text-[0.9rem] leading-normal">
            {t("didYouReceive", {
              amount: `${money(total)} ${t("sum")}`,
              name: payConfirm.customerName,
            })}
          </p>
        </div>

        <div className="h-px bg-surface-border my-4" />

        {collected > 0 && (
          <div className="flex justify-between text-[0.85rem] text-[--gray-600] mb-2.5">
            <span>{t("alreadyCollected")}</span>
            <strong>
              {money(collected)} {t("sum")}
            </strong>
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-3">
          <label className="text-[0.8125rem] font-semibold text-(--gray-700) tracking-tight">
            {t("amountReceived")}
          </label>
          <input
            type="text"
            inputMode="numeric"
            className="w-full px-3 py-2 min-h-9.5 rounded-lg text-sm outline-none transition-all duration-150 bg-white border border-(--gray-200,#e5e7eb) text-[--gray-800] hover:border-(--gray-300) focus:border-(--brand-500,#6366f1) focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
            value={received}
            placeholder={money(due)}
            onChange={(e) => setReceived(e.target.value.replace(/\D/g, ""))}
            onFocus={(e) => e.currentTarget.select()}
          />
          <p
            className={`text-[0.78rem] mt-1.5 ${settlesFully ? "text-emerald-600" : "text-(--gray-500)"}`}
          >
            {settlesFully
              ? t("willBeFullyPaid")
              : t("balanceDueAfter", {
                  amount: `${money(Math.max(0, total - newTotal))} ${t("sum")}`,
                })}
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={close}>
            {t("back")}
          </Button>
          <Button
            className="flex-1"
            disabled={receivedNum <= 0}
            onClick={async () => {
              await recordPayment(payConfirm, newTotal);
              close();
            }}
          >
            <Check size={15} strokeWidth={2.5} />{" "}
            {settlesFully ? t("yesReceived") : t("recordPayment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
