// Whether a business has settled up for the current billing period. A manual
// bookkeeping flag the superadmin sets — independent of Company.expiresAt, which
// is what actually drives the read-only lockout (see isCompanyExpired).
//
// Lives in its own module (not the Company model) so client components can
// import the values without pulling mongoose into the browser bundle.
import type { DictionaryKeys } from '@/i18n'

export type PaymentStatus = 'paid' | 'pending' | 'unpaid'

export const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'pending', 'unpaid']

export function isPaymentStatus(v: unknown): v is PaymentStatus {
  return v === 'paid' || v === 'pending' || v === 'unpaid'
}

// i18n key for each status label.
export const PAYMENT_STATUS_I18N: Record<PaymentStatus, DictionaryKeys> = {
  paid: 'paymentPaid',
  pending: 'paymentPending',
  unpaid: 'paymentUnpaid',
}
