// Locale configuration shared by the edge proxy (middleware) and the client
// i18n provider. Keep this file free of React / client-only imports so it can
// be used from `proxy.ts`.

export const LOCALES = ['en', 'uz', 'ru'] as const
export type LanguageCode = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: LanguageCode = 'uz'

// Cookie that remembers the user's chosen language (set by the switcher, read
// by the proxy when a request arrives without a locale prefix).
export const LOCALE_COOKIE = 'appLang'

export function isLocale(value: string | undefined | null): value is LanguageCode {
  return !!value && (LOCALES as readonly string[]).includes(value)
}
