// Locale configuration shared by the edge proxy (middleware) and the client
// i18n provider. Keep this file free of React / client-only imports so it can
// be used from `proxy.ts`.

export const LOCALES = ['en', 'uz', 'ru'] as const
export type LanguageCode = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: LanguageCode = 'uz'

// Locale to use when we can't detect a preference — no locale in the URL, no
// cookie, and no matching Accept-Language (e.g. social crawlers fetching the
// bare domain to build a share preview). Russian is the region's common tongue,
// so it's the neutral fallback. Distinct from DEFAULT_LOCALE, which stays the
// primary for the sitemap. Cookie / Accept-Language always take precedence.
export const FALLBACK_LOCALE: LanguageCode = 'ru'

// Cookie that remembers the user's chosen language (set by the switcher, read
// by the proxy when a request arrives without a locale prefix).
export const LOCALE_COOKIE = 'appLang'

export function isLocale(value: string | undefined | null): value is LanguageCode {
  return !!value && (LOCALES as readonly string[]).includes(value)
}
