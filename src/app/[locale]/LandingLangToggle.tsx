'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import Dropdown from '@/components/ui/Dropdown'
import { LANGUAGES } from '@/i18n'
import { LOCALE_COOKIE, isLocale, type LanguageCode } from '@/i18n/config'

const OPTIONS = LANGUAGES.map(l => ({ value: l.code, label: l.label }))

// Remember the chosen language so the proxy honours it on later locale-less
// requests. Module-scope so the cookie write isn't inside the component body.
function rememberLocale(code: LanguageCode) {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}`
}

// Locale switcher for the marketing navbar, built on the shared Dropdown. The
// landing page lives outside the dashboard's LanguageProvider, so this is
// self-contained: it swaps the locale segment of the current URL and stores the
// choice in the `appLang` cookie — same behaviour as the in-app switcher.
export function LandingLangToggle({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = (value: string) => {
    if (!isLocale(value) || value === current) return
    rememberLocale(value)
    const segments = pathname.split('/')
    if (isLocale(segments[1])) segments[1] = value
    else segments.splice(1, 0, value)
    router.push(segments.join('/') || `/${value}`)
  }

  return (
    <div style={{ width: 108 }}>
      <Dropdown
        value={current}
        onChange={switchTo}
        options={OPTIONS}
        icon={<Languages size={15} />}
        ariaLabel="Language"
      />
    </div>
  )
}
