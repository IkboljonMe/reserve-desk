'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useTranslation, DictionaryKeys } from '@/i18n'

const TABS: { labelKey: DictionaryKeys; href: string }[] = [
  { labelKey: 'admins', href: '/settings/admins' },
  { labelKey: 'services', href: '/settings/services' },
  { labelKey: 'hotelsAndRooms', href: '/settings/hotels' },
  { labelKey: 'clientGroups', href: '/settings/client-groups' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t, lang } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  // Prefix an app path with the active locale + tenant slug, e.g.
  // '/settings/admins' -> '/uz/secure/admin/safir/settings/admins'.
  const localized = (href: string) => `/${lang}/secure/admin/${slug}${href}`
  return (
    <div>
      <div className="page-header">
        <h1>{t('settings')}</h1>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: '1.5rem',
        borderBottom: '1px solid var(--gray-200)',
        paddingBottom: 0,
      }}>
        {TABS.map(tab => {
          const href = localized(tab.href)
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={tab.href}
              href={href}
              style={{
                padding: '8px 16px',
                borderBottom: isActive ? '2px solid var(--brand-500)' : '2px solid transparent',
                color: isActive ? 'var(--brand-600)' : 'var(--gray-500)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                textDecoration: 'none',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {t(tab.labelKey)}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
