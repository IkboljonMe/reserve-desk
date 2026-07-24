// Payment methods captured on a booking. We don't integrate a payment gateway —
// this only records HOW money was collected (for reporting), never processes it.
// Shared by the booking wizard, the later-payment modal, the APIs, and the
// dashboard "Payments by method" card so the set stays in one place.

import type { DictionaryKeys } from "@/i18n";

export const PAYMENT_METHODS = [
  "cash",
  "uzcard_humo",
  "visa_mastercard",
  "transfer",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// "" = unknown/not recorded yet (e.g. an unpaid booking whose method is asked later).
export type PaymentMethodValue = "" | PaymentMethod;

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return (
    typeof v === "string" && (PAYMENT_METHODS as readonly string[]).includes(v)
  );
}

// Coerce arbitrary input to a valid method or "".
export function normalizePaymentMethod(v: unknown): PaymentMethodValue {
  return isPaymentMethod(v) ? v : "";
}

// i18n key for each method's label (resolved via t() at the call site).
export const PAYMENT_METHOD_LABEL_KEY: Record<PaymentMethod, DictionaryKeys> = {
  cash: "pmCash",
  uzcard_humo: "pmUzcardHumo",
  visa_mastercard: "pmVisaMastercard",
  transfer: "pmTransfer",
};

// A distinct colour per method for the stats card (brand-neutral, readable in
// both themes).
export const PAYMENT_METHOD_COLOR: Record<PaymentMethod, string> = {
  cash: "#10b981", // emerald
  uzcard_humo: "#4f6ef7", // brand blue
  visa_mastercard: "#f59e0b", // amber
  transfer: "#a855f7", // purple
};
