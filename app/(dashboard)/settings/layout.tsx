'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Services', href: '/settings/services' },
  { label: 'Rooms', href: '/settings/rooms' },
  { label: 'Hotels', href: '/settings/hotels' },
  { label: 'General', href: '/settings' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: '1.5rem',
        borderBottom: '1px solid var(--gray-200)',
        paddingBottom: 0,
      }}>
        {TABS.map(tab => {
          const isActive = tab.href === '/settings' ? pathname === '/settings' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
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
              {tab.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
