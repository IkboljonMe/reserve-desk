import { ru, uz } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import type { LanguageCode } from '@/i18n'

const DATE_LOCALES: Partial<Record<LanguageCode, Locale>> = { ru, uz }

// date-fns falls back to English formatting when `locale` is undefined.
export function dateLocale(lang: LanguageCode): Locale | undefined {
  return DATE_LOCALES[lang]
}
