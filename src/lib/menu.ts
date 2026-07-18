import type { LocalizedText } from '@/models/localized'

// Native autonyms — each language shown in itself, so labels read correctly
// regardless of the admin's own chrome language.
export const MENU_LANG_LABELS = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbekcha",
  ar: 'العربية',
  zh: '中文',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  kk: 'Қазақша',
  tr: 'Türkçe',
} as const

export const MENU_LANGS = Object.keys(MENU_LANG_LABELS) as (keyof typeof MENU_LANG_LABELS)[]
export type MenuLang = (typeof MENU_LANGS)[number]

// Coerce arbitrary request input into a clean 10-language string map.
export function sanitizeI18n(input: unknown): LocalizedText {
  const src = (input ?? {}) as Record<string, unknown>
  const out = {} as LocalizedText
  for (const lang of MENU_LANGS) out[lang] = typeof src[lang] === 'string' ? (src[lang] as string) : ''
  return out
}

// Coerce arbitrary request input into a clean list of valid language codes
// (used for nameI18nLocked/descI18nLocked — languages kept as sourceLang text
// instead of auto-translated).
export function sanitizeLocked(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const valid = new Set<string>(MENU_LANGS)
  return [...new Set(input.filter((v): v is string => typeof v === 'string' && valid.has(v)))]
}

// Resolve a translated field for display: the requested language, falling back
// to the record's source-language `name`/`description`, then any other
// non-empty translation (checked in MENU_LANGS order). Keeps guest pages
// readable even with partial translations.
export function localized(
  i18n: Partial<LocalizedText> | undefined,
  fallback: string,
  lang: string,
): string {
  const map = (i18n ?? {}) as Partial<LocalizedText>
  const key = (MENU_LANGS as readonly string[]).includes(lang) ? (lang as MenuLang) : 'en'
  if (map[key]?.trim()) return map[key]!.trim()
  if (fallback?.trim()) return fallback.trim()
  for (const l of MENU_LANGS) {
    if (map[l]?.trim()) return map[l]!.trim()
  }
  return ''
}

// Service fee for an order subtotal, given the hotel's fee config. Integer UZS.
export function computeServiceFee(
  subtotal: number,
  feeType: 'none' | 'percent' | 'fixed',
  feeValue: number,
): number {
  if (feeType === 'percent') return Math.round((subtotal * feeValue) / 100)
  if (feeType === 'fixed') return Math.max(0, Math.round(feeValue))
  return 0
}

// ── Guest hub URLs ──────────────────────────────────────────────────────────
// The public guest hub lives on the `menu` subdomain, path-based by the hotel's
// (globally-unique) slug: menu.bronit.uz/<locale>/<hotelSlug>. Room is an
// optional query param carried from the room QR.

// Root domain from any host, stripping a known leading subdomain.
// "app.bronit.uz" | "menu.bronit.uz" | "bronit.uz" → "bronit.uz".
export function rootDomain(host: string): string {
  return host.replace(/^(www|app|admin|super|demo|menu)\./, '')
}

function roomQuery(room?: string): string {
  return room ? `?room=${encodeURIComponent(room)}` : ''
}

// Internal (same-origin) guest paths — used for in-page navigation on the guest
// site, so they stay on whatever host the guest is already browsing.
export function guestHubPath(locale: string, hotelSlug: string, room?: string): string {
  return `/${locale}/menu/${hotelSlug}${roomQuery(room)}`
}
export function guestFoodPath(locale: string, hotelSlug: string, room?: string): string {
  return `/${locale}/menu/${hotelSlug}/food${roomQuery(room)}`
}

// Absolute public hub URL for sharing / QR codes, on the menu subdomain.
// `host` is the current window.location.host (any subdomain) — we normalize it.
export function publicHubUrl(host: string, locale: string, hotelSlug: string, room?: string, protocol = 'https:'): string {
  return `${protocol}//menu.${rootDomain(host)}/${locale}/${hotelSlug}${roomQuery(room)}`
}
