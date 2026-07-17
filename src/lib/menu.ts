import type { LocalizedText } from '@/models/localized'

export const MENU_LANGS = ['en', 'ru', 'uz'] as const
export type MenuLang = (typeof MENU_LANGS)[number]

// Coerce arbitrary request input into a clean { en, ru, uz } string map.
export function sanitizeI18n(input: unknown): LocalizedText {
  const src = (input ?? {}) as Record<string, unknown>
  return {
    en: typeof src.en === 'string' ? src.en : '',
    ru: typeof src.ru === 'string' ? src.ru : '',
    uz: typeof src.uz === 'string' ? src.uz : '',
  }
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

// Resolve a translated field for display: the requested language, falling back
// to the record's source-language `name`/`description`, then any non-empty
// translation. Keeps guest pages readable even with partial translations.
export function localized(
  i18n: Partial<LocalizedText> | undefined,
  fallback: string,
  lang: string,
): string {
  const map = (i18n ?? {}) as Partial<LocalizedText>
  const key = (MENU_LANGS as readonly string[]).includes(lang) ? (lang as MenuLang) : 'en'
  return map[key]?.trim() || fallback || map.en?.trim() || map.ru?.trim() || map.uz?.trim() || ''
}
