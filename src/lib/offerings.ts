import { normalizeFeatures, type FeatureKey } from './planFeatures'

// How a line item's quantity works, which decides how price is multiplied and
// what the order builder asks for:
//   flat        → quantity is always 1 (a single monthly fee)
//   per_service → quantity = how many bookable services
//   per_room    → quantity = the hotel's room count (menu priced per room)
export type OfferingUnit = 'flat' | 'per_service' | 'per_room'

// A sellable building block the superadmin can drop onto an order. Prices here
// are the catalog DEFAULT (monthly UZS per unit) — editable per order, so the
// superadmin can quote in real time and negotiate. `feature` is the app module
// this offering unlocks on the provisioned business (see FeatureKey).
export interface Offering {
  key: string
  name: string          // internal (English) label — superadmin-only tool
  unit: OfferingUnit
  defaultPrice: number  // monthly UZS per unit — PLACEHOLDER, confirm with the team
  feature: FeatureKey
}

// NOTE: defaultPrice values are placeholders to be confirmed. Everything is
// snapshot-copied onto each order line, so tuning these later never rewrites
// past orders.
export const OFFERINGS: Offering[] = [
  { key: 'service',          name: 'Booking service',        unit: 'per_service', defaultPrice: 150_000, feature: 'calendar' },
  { key: 'service_telegram', name: 'Telegram for service',   unit: 'per_service', defaultPrice: 50_000,  feature: 'telegram' },
  { key: 'menu',             name: 'Hotel menu (per room)',  unit: 'per_room',    defaultPrice: 10_000,  feature: 'menu' },
  { key: 'menu_telegram',    name: 'Telegram for menu',      unit: 'flat',        defaultPrice: 50_000,  feature: 'telegram' },
  { key: 'clients',          name: 'Clients CRM',            unit: 'flat',        defaultPrice: 50_000,  feature: 'clients' },
  { key: 'contracts',        name: 'Contracts',              unit: 'flat',        defaultPrice: 50_000,  feature: 'contracts' },
  { key: 'analytics',        name: 'Analytics & reports',    unit: 'flat',        defaultPrice: 100_000, feature: 'analytics' },
]

export const OFFERING_BY_KEY: Record<string, Offering> = Object.fromEntries(
  OFFERINGS.map((o) => [o.key, o]),
)

// Quick-start bundles for the order builder — the "tier as preset" shortcut.
// Clicking one drops these offerings onto the quote at their catalog default
// price; the superadmin then tweaks freely. Cumulative, mirroring the landing
// tiers (pro ⊇ standard, vip ⊇ pro).
export const PRESET_OFFERINGS: Record<string, string[]> = {
  standard: ['service', 'clients', 'contracts'],
  pro: ['service', 'service_telegram', 'menu', 'menu_telegram', 'clients', 'contracts'],
  vip: ['service', 'service_telegram', 'menu', 'menu_telegram', 'clients', 'contracts', 'analytics'],
}

export function isOfferingKey(v: unknown): v is string {
  return typeof v === 'string' && v in OFFERING_BY_KEY
}

// ── Order pricing math ──────────────────────────────────────────────────────
// One place for the money rules so the builder UI, the API, and provisioning
// all agree. Discount applies to the whole cycle (the annual-commitment lever).

export type BillingCycle = 'monthly' | 'yearly'

export interface OrderLineLike {
  unitPrice: number
  quantity: number
}

// Sum of every line's unitPrice × quantity — the recurring monthly figure
// before billing cycle and discount.
export function monthlySubtotal(lines: OrderLineLike[]): number {
  return lines.reduce((sum, l) => sum + Math.max(0, l.unitPrice) * Math.max(0, l.quantity), 0)
}

// Months charged up-front for a cycle: 1 for monthly, 12 for yearly.
export function cycleMonths(cycle: BillingCycle): number {
  return cycle === 'yearly' ? 12 : 1
}

// Final amount to charge for the chosen cycle, after the discount %.
export function orderTotal(lines: OrderLineLike[], cycle: BillingCycle, discountPercent: number): number {
  const gross = monthlySubtotal(lines) * cycleMonths(cycle)
  const pct = clampPercent(discountPercent)
  return Math.round(gross * (1 - pct / 100))
}

export function clampPercent(v: unknown): number {
  return Math.min(100, Math.max(0, Math.round(Number(v) || 0)))
}

// A fully-snapshotted order line — the catalog fields (label/unit/feature) are
// copied from the offering so later catalog edits don't rewrite the order.
export interface BuiltLine {
  offeringKey: string
  label: string
  unit: OfferingUnit
  feature: FeatureKey
  unitPrice: number
  quantity: number
}

// Turn a raw request body's `lines` into validated, snapshotted order lines:
// unknown offering keys are dropped, `flat` lines are forced to quantity 1,
// zero-quantity lines are removed, and duplicates collapse (last wins).
export function buildLines(raw: unknown): BuiltLine[] {
  if (!Array.isArray(raw)) return []
  const byKey = new Map<string, BuiltLine>()
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const o = OFFERING_BY_KEY[(r as { offeringKey?: string }).offeringKey ?? '']
    if (!o) continue
    const unitPrice = Math.max(0, Math.round(Number((r as { unitPrice?: unknown }).unitPrice)) || 0)
    const quantity = o.unit === 'flat'
      ? 1
      : Math.max(0, Math.round(Number((r as { quantity?: unknown }).quantity)) || 0)
    if (quantity === 0) continue
    byKey.set(o.key, { offeringKey: o.key, label: o.name, unit: o.unit, feature: o.feature, unitPrice, quantity })
  }
  return [...byKey.values()]
}

// The distinct app modules a set of order lines unlocks — used when provisioning
// the business from the order.
export function featuresFromLines(lines: { feature: FeatureKey }[]): FeatureKey[] {
  return normalizeFeatures(lines.map((l) => l.feature))
}

// Coerce the editable order fields from a request body, recomputing all money
// server-side from the validated lines (never trusting client totals). Shared by
// the create (POST) and update (PUT) order routes.
export function readOrderFields(body: Record<string, unknown>) {
  const lines = buildLines(body.lines)
  const billingCycle: BillingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly'
  const discountPercent = clampPercent(body.discountPercent)
  const paymentDate = body.paymentDate ? new Date(body.paymentDate as string) : null

  return {
    businessName: typeof body.businessName === 'string' ? body.businessName.trim() : '',
    contactName: typeof body.contactName === 'string' ? body.contactName.trim() : '',
    contactPhone: typeof body.contactPhone === 'string' ? body.contactPhone.trim() : '',
    lines,
    billingCycle,
    discountPercent,
    monthlySubtotal: monthlySubtotal(lines),
    total: orderTotal(lines, billingCycle, discountPercent),
    paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '',
    paymentDate: paymentDate && !Number.isNaN(paymentDate.getTime()) ? paymentDate : null,
    note: typeof body.note === 'string' ? body.note.trim() : '',
  }
}
