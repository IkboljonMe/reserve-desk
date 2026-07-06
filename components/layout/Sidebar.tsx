'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    label: 'Calendar',
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
    label: 'New Booking',
    href: '/book',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    children: [
      { label: 'Services', href: '/settings/services' },
      { label: 'General', href: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>ReserveDesk</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>Hotel Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/settings'
            ? pathname.startsWith('/settings')
            : pathname.startsWith(item.href)

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : 'var(--sidebar-text)',
                  background: isActive ? 'rgba(79,110,247,0.25)' : 'transparent',
                  transition: 'all 0.15s ease',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <span style={{ color: isActive ? 'var(--sidebar-active)' : 'var(--sidebar-text)' }}>{item.icon}</span>
                {item.label}
                {isActive && item.href === '/settings' && (
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)' }}>
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
