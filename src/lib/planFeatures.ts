// The catalog of app modules a Plan can grant/withhold. Shared between the
// superadmin Plans UI, the Plan model's validation, and the tenant Sidebar's
// gating — keep this the single source of truth for feature keys.
export const FEATURE_KEYS = [
  'calendar',
  'clients',
  'contracts',
  'menu',
  'notifications',
  'guestHub',
] as const

export type FeatureKey = typeof FEATURE_KEYS[number]

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  calendar: 'Calendar & Bookings',
  clients: 'Clients',
  contracts: 'Contracts',
  menu: 'Menu & Orders',
  notifications: 'Notifications',
  guestHub: 'Guest Hub',
}

export function isFeatureKey(v: unknown): v is FeatureKey {
  return typeof v === 'string' && (FEATURE_KEYS as readonly string[]).includes(v)
}
