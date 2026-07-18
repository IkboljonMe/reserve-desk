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
  'telegram',
] as const

export type FeatureKey = typeof FEATURE_KEYS[number]

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  calendar: 'Calendar & Bookings',
  clients: 'Clients',
  contracts: 'Contracts',
  menu: 'Menu & Orders',
  notifications: 'Notifications',
  guestHub: 'Guest Hub',
  telegram: 'Telegram Bot Notifications',
}

// i18n key for each feature's label, so localized surfaces (the landing page)
// can translate them. The superadmin UI uses FEATURE_LABELS (English) directly.
export const FEATURE_LABEL_I18N: Record<FeatureKey, string> = {
  calendar: 'featureCalendar',
  clients: 'featureClients',
  contracts: 'featureContracts',
  menu: 'featureMenu',
  notifications: 'featureNotifications',
  guestHub: 'featureGuestHub',
  telegram: 'featureTelegram',
}

export function isFeatureKey(v: unknown): v is FeatureKey {
  return typeof v === 'string' && (FEATURE_KEYS as readonly string[]).includes(v)
}
