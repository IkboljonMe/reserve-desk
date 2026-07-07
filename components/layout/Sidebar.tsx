'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { useState, useEffect, useCallback } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [notifCount, setNotifCount] = useState(0)

  const loadNotifCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifCount(typeof data.count === 'number' ? data.count : 0)
    } catch {
      /* silent — badge is non-critical */
    }
  }, [])

  // Refresh the badge on navigation and whenever a reminder is dismissed.
  useEffect(() => { loadNotifCount() }, [loadNotifCount, pathname])
  useEffect(() => {
    const handler = () => loadNotifCount()
    window.addEventListener('notifications-updated', handler)
    return () => window.removeEventListener('notifications-updated', handler)
  }, [loadNotifCount])

  const NAV_ITEMS = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      label: t('calendar'),
      href: '/calendar',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: t('newBooking'),
      href: '/book',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      ),
    },
    {
      label: 'Clients',
      href: '/clients',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Contracts',
      href: '/contracts',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6"/>
          <path d="M16 13H8M16 17H8M10 9H8"/>
        </svg>
      ),
    },
    {
      label: 'Notifications',
      href: '/notifications',
      badge: notifCount,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      label: t('settings'),
      href: '/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
      children: [
        { label: t('services'), href: '/settings/services' },
        { label: 'Hotels & Rooms', href: '/settings/hotels' },
        { label: t('general'), href: '/settings' },
      ],
    },
  ]

  return (
    <aside style={{
      width: 232,
      minWidth: 232,
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        padding: '1.35rem 1.25rem 1.1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 38, height: 38,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <img src="/assets/logo-safir.png" alt="Safir Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Safir Hotel Services</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.02em' }}>Hotel Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{
          padding: '0 10px 8px',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
        }}>
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/settings'
            ? pathname.startsWith('/settings')
            : pathname.startsWith(item.href)

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '9px 11px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : 'var(--sidebar-text)',
                  background: isActive ? 'linear-gradient(135deg, rgba(79,110,247,0.28), rgba(124,58,237,0.22))' : 'transparent',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(124,146,255,0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 18, borderRadius: 4, background: 'var(--sidebar-active)',
                  }} />
                )}
                <span style={{ display: 'inline-flex', color: isActive ? '#fff' : 'var(--sidebar-text)' }}>{item.icon}</span>
                {item.label}
                {'badge' in item && (item.badge ?? 0) > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    minWidth: 18, height: 18, padding: '0 5px',
                    borderRadius: 9,
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: '0.68rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(239,68,68,0.45)',
                  }}>
                    {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                  </span>
                )}
                {isActive && item.href === '/settings' && (
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                )}
              </Link>

              {/* Sub-items for settings */}
              {item.children && isActive && (
                <div style={{ marginLeft: 28, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {item.children.map(child => {
                    const childActive = pathname === child.href || (child.href !== '/settings' && pathname.startsWith(child.href))
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        style={{
                          display: 'block',
                          padding: '6px 10px',
                          borderRadius: 6,
                          textDecoration: 'none',
                          color: childActive ? '#fff' : 'var(--sidebar-text)',
                          background: childActive ? 'rgba(79,110,247,0.2)' : 'transparent',
                          fontSize: '0.8125rem',
                          fontWeight: childActive ? 500 : 400,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom label */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.2)',
        fontSize: '0.7rem',
      }}>
        v1.0
      </div>
    </aside>
  )
}
