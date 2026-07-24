import type { MetadataRoute } from 'next'
import { LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE } from '@/i18n/config'

// Marketing domain — see metadataBase in src/app/[locale]/layout.tsx and the
// root-domain checks in src/proxy.ts ("The marketing site is always public.").
const BASE_URL = 'https://bronit.uz'

// Only the genuinely public, indexable pages: the marketing landing page in
// each locale. Everything under /secure/** requires auth (owner/admin/
// superadmin dashboards), /login is an auth gate with no unique content,
// /demo is an auto-login redirect endpoint, and /hotel/[hotelHostname] is an
// unfinished placeholder — none of those belong in a sitemap. Keep this in
// sync with robots.ts, which blocks crawling of those same paths.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map(locale => [locale, `${BASE_URL}/${locale}`]),
  )
  // hreflang requires an x-default fallback for visitors whose language matches
  // none of ours — point it at the neutral fallback locale (Russian), matching
  // where the proxy redirects an undetected-preference visitor.
  languages['x-default'] = `${BASE_URL}/${FALLBACK_LOCALE}`

  const landing: MetadataRoute.Sitemap = LOCALES.map(locale => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: locale === DEFAULT_LOCALE ? 1 : 0.9,
    alternates: { languages },
  }))

  // Public legal pages (linked from the footer).
  const legal: MetadataRoute.Sitemap = ['privacy', 'terms'].flatMap(doc =>
    LOCALES.map(locale => ({
      url: `${BASE_URL}/${locale}/${doc}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: {
        languages: Object.fromEntries([
          ...LOCALES.map(l => [l, `${BASE_URL}/${l}/${doc}`]),
          ['x-default', `${BASE_URL}/${FALLBACK_LOCALE}/${doc}`],
        ]),
      },
    })),
  )

  return [...landing, ...legal]
}
