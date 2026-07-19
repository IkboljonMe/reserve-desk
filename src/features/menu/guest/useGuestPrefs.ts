'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { MENU_LANGS, type MenuLang } from '@/lib/menu'

// Shared guest-experience preferences (language + light/dark) for the hub and
// food pages. Deliberately separate from the app's admin ThemeProvider/i18n —
// a guest's choice here must never bleed into the staff dashboard's theme
// (single shared 'theme' key there), and the guest picks from all 10 MENU_LANGS
// while the dashboard's chrome only ever offers uz/ru/en.
const LANG_KEY = 'bronit_hub_lang'
const THEME_KEY = 'bronit_guest_theme'

export type GuestTheme = 'dark' | 'light'

// A dark, moody in-room app look by default (matches the original hub design);
// light is available via the toggle. Same CSS custom-property *names* the rest
// of the app's admin theme uses, but supplied as a local override on the guest
// pages' own root wrapper — so this never touches the global :root/.dark rules.
export const GUEST_THEME_VARS: Record<GuestTheme, Record<string, string>> = {
  dark: {
    '--surface-bg': '#0c0c0e',
    '--surface-card': '#1a1a1c',
    '--surface-border': 'rgba(255,255,255,0.08)',
    '--gray-900': '#ffffff',
    '--gray-800': '#f0f0f0',
    '--gray-700': 'rgba(255,255,255,0.85)',
    '--gray-600': 'rgba(255,255,255,0.68)',
    '--gray-500': 'rgba(255,255,255,0.55)',
    '--gray-400': 'rgba(255,255,255,0.4)',
    '--gray-300': 'rgba(255,255,255,0.28)',
    '--gray-200': 'rgba(255,255,255,0.14)',
    '--gray-100': 'rgba(255,255,255,0.08)',
    '--gray-50': 'rgba(255,255,255,0.05)',
    '--brand-500': '#4f6ef7',
    '--brand-600': '#3d5ce8',
    '--color-danger': '#f87171',
  },
  light: {
    '--surface-bg': '#f7f7f8',
    '--surface-card': '#ffffff',
    '--surface-border': '#e6e9ef',
    '--gray-900': '#111827',
    '--gray-800': '#1f2937',
    '--gray-700': '#374151',
    '--gray-600': '#4b5563',
    '--gray-500': '#6b7584',
    '--gray-400': '#9aa3b0',
    '--gray-300': '#cdd2db',
    '--gray-200': '#e6e9ef',
    '--gray-100': '#f0f2f5',
    '--gray-50': '#f8f9fb',
    '--brand-500': '#4f6ef7',
    '--brand-600': '#3d5ce8',
    '--color-danger': '#ef4444',
  },
}

function readLang(fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = localStorage.getItem(LANG_KEY)
  return v && (MENU_LANGS as readonly string[]).includes(v) ? v : fallback
}

function readTheme(): GuestTheme {
  if (typeof window === 'undefined') return 'dark'
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' ? 'light' : 'dark'
}

// `initialLocale` seeds the language before the persisted choice loads (avoids
// a flash of the wrong language on first paint) — the route's own uz/ru/en
// locale is a reasonable guess, and it's inside MENU_LANGS either way.
export function useGuestPrefs(initialLocale: string) {
  const [lang, setLangState] = useState<MenuLang>(() =>
    (MENU_LANGS as readonly string[]).includes(initialLocale) ? (initialLocale as MenuLang) : 'en')
  const [theme, setThemeState] = useState<GuestTheme>('dark')

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate persisted prefs after mount */
    setLangState(readLang(initialLocale) as MenuLang)
    setThemeState(readTheme())
    /* eslint-enable react-hooks/set-state-in-effect */
    // Only on mount — the initial locale is just a first-paint seed, not a dependency to re-sync on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLang = (l: MenuLang) => {
    setLangState(l)
    try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ }
  }

  const toggleTheme = () => {
    const next: GuestTheme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    try { localStorage.setItem(THEME_KEY, next) } catch { /* ignore */ }
  }

  const themeVars = GUEST_THEME_VARS[theme]

  // Also apply on <body> so portaled UI (the cart Modal renders via
  // createPortal to document.body, outside this page's own DOM subtree and
  // thus outside the wrapper div's inline-style var scope) matches too. Guest
  // pages are always a standalone full-page load — never mounted alongside
  // the dashboard — so this is safe despite touching a "global" element.
  useEffect(() => {
    const body = document.body
    const prev: Record<string, string> = {}
    for (const [k, v] of Object.entries(themeVars)) {
      prev[k] = body.style.getPropertyValue(k)
      body.style.setProperty(k, v)
    }
    return () => {
      for (const [k, v] of Object.entries(prev)) body.style.setProperty(k, v)
    }
  }, [themeVars])

  return { lang, setLang, theme, toggleTheme, themeVars: themeVars as CSSProperties }
}
