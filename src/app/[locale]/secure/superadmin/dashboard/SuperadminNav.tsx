'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n'

export default function SuperadminNav({ basePath, notifCount }: { basePath: string; notifCount: number }) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const tabs = [
    { href: basePath, label: t('companies') },
    { href: `${basePath}/plans`, label: t('plans') },
    { href: `${basePath}/notifications`, label: t('notifications'), badge: notifCount },
  ]

  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 1.5rem', background: '#14192a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.7rem 0.9rem',
              fontSize: '0.8125rem', fontWeight: 600,
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              borderBottom: active ? '2px solid var(--brand-500, #6366f1)' : '2px solid transparent',
            }}
          >
            {tab.label}
            {!!tab.badge && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                background: '#ef4444', color: '#fff', fontSize: '0.6875rem', fontWeight: 700,
              }}>
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
