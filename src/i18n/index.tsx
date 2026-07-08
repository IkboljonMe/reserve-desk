'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import en from './locales/en.json'
import uz from './locales/uz.json'
import ru from './locales/ru.json'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type LanguageCode } from './config'

export type { LanguageCode }

/**
 * Translation dictionaries.
 *
 * The strings live in `i18n/locales/{en,uz,ru}.json`, keyed by a stable
 * camelCase key. `en` is the source language and defines the full set of keys;
 * `uz` and `ru` fall back to `en` when a key is missing. When adding a string,
 * add the key to all three files (see the i18n-translations skill).
 *
 * The active language is driven by the URL locale segment (`/en`, `/uz`,
 * `/ru`) — `LanguageProvider` receives it as `lang` and `setLang` navigates to
 * the same path under a different locale. NEVER translate user-supplied /
 * dynamic values — only fixed UI chrome.
 *
 * Interpolation: use `{name}` tokens in a value and pass params to `t`:
 *   t('deleteConfirm', { name: hotel.name })
 */
const DICTS: Record<LanguageCode, Record<string, string>> = { en, uz, ru }

// Keys are defined by the English source dictionary; uz/ru mirror the same set.
export type DictionaryKeys = keyof typeof en

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'uz', label: "O'Z" },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]

interface LanguageContextType {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (key: DictionaryKeys, params?: Record<string, string | number>) => string
}

function translate(
  lang: LanguageCode,
  key: DictionaryKeys,
  params?: Record<string, string | number>,
): string {
  const k = key as string
  let str = DICTS[lang][k] ?? DICTS.en[k] ?? k
  if (params) {
    for (const [pk, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${pk}\\}`, 'g'), String(v))
    }
  }
  return str
}

const LanguageContext = createContext<LanguageContextType>({
  lang: DEFAULT_LOCALE,
  setLang: () => {},
  t: (key) => key as string,
})

export function LanguageProvider({ children, lang }: { children: ReactNode; lang: LanguageCode }) {
  const router = useRouter()
  const pathname = usePathname()

  const setLang = (newLang: LanguageCode) => {
    if (newLang === lang) return
    // Remember the choice so the proxy can honour it on locale-less requests.
    document.cookie = `${LOCALE_COOKIE}=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}`
    // Swap the locale segment of the current path, e.g. /uz/calendar -> /en/calendar.
    const segments = pathname.split('/')
    if (isLocale(segments[1])) segments[1] = newLang
    else segments.splice(1, 0, newLang)
    router.push(segments.join('/') || `/${newLang}`)
  }

  const t = (key: DictionaryKeys, params?: Record<string, string | number>): string =>
    translate(lang, key, params)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
