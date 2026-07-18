'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation, DictionaryKeys } from '@/i18n'

const TABS: { labelKey: DictionaryKeys; href: string }[] = [
  { labelKey: 'admins', href: '/settings/admins' },
  { labelKey: 'services', href: '/settings/services' },
  { labelKey: 'hotelsAndRooms', href: '/settings/hotels' },
  { labelKey: 'clientGroups', href: '/settings/client-groups' },
  { labelKey: 'menu', href: '/settings/menu' },
  { labelKey: 'telegram', href: '/settings/telegram' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  // Mirror the current URL's style: everything before "/settings" is the base
  // (clean "/ru" on the app.* subdomain, or "/ru/secure/company/<slug>" on the
  // root domain). This keeps tab links — and their active state — matching
  // whichever path form the browser is actually on.
  const base = pathname.includes('/settings') ? pathname.slice(0, pathname.indexOf('/settings')) : pathname
  const localized = (href: string) => `${base}${href}`
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
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
