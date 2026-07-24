"use client";

import { BedDouble } from "lucide-react";
import { useTranslation } from "@/i18n";
import { getServiceIcon } from "@/lib/serviceIcons";
import { formatDuration, formatUZS, slotEnd } from "../utils";
import type { BookingWizard } from "../useBookingWizard";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL_KEY,
  type PaymentMethodValue,
} from "@/lib/paymentMethods";

// Slide: a read-only summary of everything picked in the previous slides,
// plus headcount and payment status. Back/Confirm live in the modal's shared
// footer, not here.
export function ReviewStep({ w }: { w: BookingWizard }) {
  const { t } = useTranslation();
  const {
    hotels,
    selectedHotelId,
    selectedService,
    selectedVariant,
    bookingType,
    categoryMeta,
    activePlan,
    selectedSlot,
    date,
    customerName,
    customerPhone,
    roomNumber,
    notes,
    menuItems,
    menuReadyTime,
    menuSubtotal,
    menuServiceFee,
    menuTotal,
    persons,
    setPersons,
    paid,
    setPaid,
    amountPaid,
    setAmountPaid,
    paymentMethod,
    setPaymentMethod,
  } = w;
  if (!selectedService || !activePlan || !selectedSlot) return null;

  return (
    <div>
      <h2 className="mb-1">{t("confirmBooking")}</h2>
      <p className="text-gray-500 text-sm mt-0 mb-5">
        {t("reviewYourBooking")}
      </p>

      {/* Order summary */}
      <div
        className="bg-gray-50 border border-gray-200 p-4 mb-5 text-sm grid gap-y-[0.6rem] gap-x-4 text-gray-600"
        style={{ gridTemplateColumns: "auto 1fr" }}
      >
        <strong className="text-gray-800">{t("hotel")}</strong>
        <span>
          {hotels.find((h) => h._id === selectedHotelId)?.shortName || "—"}
        </span>

        <strong className="text-gray-800">{t("service")}</strong>
        <span className="flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex"
            style={{ color: selectedService.color }}
          >
            {getServiceIcon(selectedService.name)}
          </span>
          {selectedService.name}
          {selectedVariant && (
            <span
              className="inline-flex items-center gap-1.25 px-2.5 py-0.75 rounded-full font-semibold text-[0.75rem]"
              style={{
                background: `${selectedService.color}12`,
                color: selectedService.color,
              }}
            >
              {selectedVariant.name}
            </span>
          )}
        </span>

        <strong className="text-gray-800">{t("toWhom")}</strong>
        <span className="flex items-center gap-1.5 flex-wrap">
          {customerName || <span className="text-gray-300">{t("guest")}</span>}
          {customerPhone && (
            <span className="text-gray-400">· {customerPhone}</span>
          )}
          {categoryMeta && (
            <span
              className="inline-flex items-center gap-1.25 px-2.5 py-0.75 rounded-full font-semibold text-[0.75rem]"
              style={{
                background: `${categoryMeta.color}18`,
                color: categoryMeta.color,
              }}
            >
              {categoryMeta.label}
            </span>
          )}
          {bookingType === "room" && roomNumber && (
            <span className="inline-flex items-center gap-1.25 px-2.5 py-0.75 rounded-full font-semibold text-[0.75rem] bg-gray-100 text-gray-600">
              <BedDouble size={12} /> {roomNumber}
            </span>
          )}
        </span>

        {bookingType !== "room" && roomNumber && (
          <>
            <strong className="text-gray-800">{t("roomNumberField")}</strong>
            <span>{roomNumber}</span>
          </>
        )}

        <strong className="text-gray-800">{t("whenLabel")}</strong>
        <span>
          {date} · {selectedSlot} – {slotEnd(selectedSlot, activePlan.duration)}{" "}
          ({formatDuration(activePlan.duration)})
        </span>

        <strong className="text-gray-800">{t("howMuch")}</strong>
        <span className="text-brand-700 font-bold">
          {activePlan.price === 0
            ? t("isFree")
            : `${formatUZS(activePlan.price)} ${t("sum")}`}
        </span>

        {notes && (
          <>
            <strong className="text-gray-800">{t("notesOptional")}</strong>
            <span>{notes}</span>
          </>
        )}

        {menuItems.length > 0 && (
          <>
            <strong className="text-gray-800">{t("menu")}</strong>
            <span>
              {formatUZS(menuTotal)} {t("sum")}
              {menuReadyTime && ` · ${t("menuReadyTime")} ${menuReadyTime}`}
            </span>
          </>
        )}
      </div>

      {menuItems.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 px-4 py-[0.85rem] mb-5 text-[0.82rem] text-gray-600">
          {menuItems.map((it, i) => (
            <div key={i} className="flex justify-between mb-0.75">
              <span>
                {it.qty}x {it.name}
              </span>
              <span>{formatUZS(it.qty * it.price)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-gray-200 mt-1.5 pt-1.5">
            <div className="flex justify-between">
              <span>{t("menuSubtotal")}</span>
              <span>{formatUZS(menuSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("menuServiceFee")}</span>
              <span>{formatUZS(menuServiceFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800">
              <span>{t("menuTotal")}</span>
              <span>{formatUZS(menuTotal)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="form-group mb-5 max-w-50">
        <label className="form-label">{t("personsCount")}</label>
        <input
          type="number"
          className="form-input"
          min={1}
          step={1}
          value={persons}
          onChange={(e) =>
            setPersons(Math.max(1, parseInt(e.target.value) || 1))
          }
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <div className="form-group mb-0">
        <label className="form-label">{t("payment")}</label>
        {activePlan.price === 0 ? (
          <div className="inline-flex items-center gap-1.25 px-3 py-2 rounded-full font-semibold text-[0.75rem] bg-blue-500/9 text-blue-600">
            {t("freeNoPayment")}
          </div>
        ) : (
          <>
            <select
              className="form-select max-w-50"
              value={paid ? "paid" : amountPaid > 0 ? "deposit" : "unpaid"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "paid") {
                  setPaid(true);
                  setAmountPaid(activePlan.price);
                } else if (v === "deposit") {
                  setPaid(false);
                  setAmountPaid(Math.round(activePlan.price / 2));
                } else {
                  setPaid(false);
                  setAmountPaid(0);
                }
              }}
            >
              <option value="unpaid">{t("unpaid")}</option>
              <option value="deposit">{t("deposit")}</option>
              <option value="paid">{t("paid")}</option>
            </select>
            {!paid && amountPaid > 0 && (
              <div className="mt-2.5 max-w-50">
                <label className="form-label text-[0.78rem]">
                  {t("depositAmount")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  value={formatUZS(amountPaid)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setAmountPaid(
                      Math.min(activePlan.price, Number(digits) || 0),
                    );
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <p className="text-[0.75rem] text-gray-500 mt-1.5 mb-0">
                  {t("balanceDueAfter", {
                    amount: `${formatUZS(Math.max(0, activePlan.price - amountPaid))} ${t("sum")}`,
                  })}
                </p>
              </div>
            )}
            {/* How the collected money was paid — only when money is taken now. */}
            {(paid || amountPaid > 0) && (
              <div className="mt-2.5 max-w-50">
                <label className="form-label text-[0.78rem]">
                  {t("paymentMethod")}
                </label>
                <select
                  className="form-select"
                  value={paymentMethod || "cash"}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethodValue)
                  }
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(PAYMENT_METHOD_LABEL_KEY[m])}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
