import en from './locales/en.json'
import uz from './locales/uz.json'
import ru from './locales/ru.json'
import { isLocale, DEFAULT_LOCALE, type LanguageCode } from './config'

const DICTS: Record<LanguageCode, Record<string, string>> = { en, uz, ru }

// Server-side translator for Server Components that can't use the client
// `useTranslation` hook (e.g. the login page). Mirrors the client `t`:
// locale value with `en` fallback, plus `{token}` interpolation.
export function getT(locale: string) {
  const lang: LanguageCode = isLocale(locale) ? locale : DEFAULT_LOCALE
  return (key: string, params?: Record<string, string | number>): string => {
    let str = DICTS[lang][key] ?? DICTS.en[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return str
  }
}
