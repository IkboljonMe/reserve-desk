// The catalog of app modules a plan/business can grant or withhold. Shared
// between the superadmin Plans + Companies UIs, the Plan/Company models, and the
// tenant Sidebar's gating — keep this the single source of truth for feature
// keys. Every key here maps to something the app actually turns on/off, so a
// toggle is never cosmetic.
export const FEATURE_KEYS = [
  'calendar',   // Calendar & Bookings (also the /book wizard) — the core module
  'clients',    // Clients CRM + groups
  'contracts',  // Partner contracts + expiry notifications
  'telegram',   // Telegram booking/order notifications
  'menu',       // QR guest menu, room-service orders & guest hub
  'analytics',  // Dashboard revenue analytics & payment breakdowns
] as const

export type FeatureKey = typeof FEATURE_KEYS[number]

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  calendar: 'Calendar & Bookings',
  clients: 'Clients',
  contracts: 'Contracts',
  telegram: 'Telegram Notifications',
  menu: 'QR Menu & Orders',
  analytics: 'Analytics & Reports',
}

// i18n key for each feature's label, so localized surfaces (the landing page,
// the tenant UI) can translate them. The superadmin UI uses FEATURE_LABELS.
export const FEATURE_LABEL_I18N: Record<FeatureKey, string> = {
  calendar: 'featureCalendar',
  clients: 'featureClients',
  contracts: 'featureContracts',
  telegram: 'featureTelegram',
  menu: 'featureMenu',
  analytics: 'featureAnalytics',
}

export function isFeatureKey(v: unknown): v is FeatureKey {
  return typeof v === 'string' && (FEATURE_KEYS as readonly string[]).includes(v)
}

// Coerce arbitrary input (an API body, older data) into a clean, de-duplicated
// list of valid feature keys, preserving catalog order.
export function normalizeFeatures(input: unknown): FeatureKey[] {
  if (!Array.isArray(input)) return []
  const set = new Set(input.filter(isFeatureKey))
  return FEATURE_KEYS.filter((k) => set.has(k))
}

// Default feature set for the three seeded tiers. Tiers are cumulative
// (pro ⊇ standard, vip ⊇ pro). Used to seed a new plan and, through the plan,
// a new business. A plan key not listed here defaults to no features (a blank
// "Custom" plan the superadmin fills in by hand).
export const DEFAULT_PLAN_FEATURES: Record<string, FeatureKey[]> = {
  standard: ['calendar', 'clients', 'contracts', 'telegram'],
  pro: ['calendar', 'clients', 'contracts', 'telegram', 'menu'],
  vip: ['calendar', 'clients', 'contracts', 'telegram', 'menu', 'analytics'],
}

export function defaultFeaturesForPlan(key: string): FeatureKey[] {
  return DEFAULT_PLAN_FEATURES[key] ?? []
}
