'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation, LANGUAGES, LanguageCode } from '@/i18n'
import { useState, useEffect, useCallback } from 'react'
import type { SessionRole } from '@/lib/session'

const EXPANDED_WIDTH = 232
const RAIL_WIDTH = 72

export default function Sidebar({
  collapsed = false,
  role = 'admin',
  onToggle,
  userName = '',
  userEmail = '',
  hotelName = '',
}: {
  collapsed?: boolean
  role?: SessionRole
  onToggle?: () => void
  userName?: string
  userEmail?: string
  hotelName?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang, setLang } = useTranslation()
  const [notifCount, setNotifCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  // Prefix an app path with the active locale, e.g. '/calendar' -> '/uz/calendar'.
  const localized = (href: string) => `/${lang}${href}`

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(localized('/login'))
    router.refresh()
  }

  // Owner has no single hotel; admins are scoped to one. Show whichever applies
  // as the account's context line under the name.
  const accountContext = role === 'owner' ? t('owner') : (hotelName || t('hotelAdmin'))

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
      label: t('dashboard'),
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
      label: t('clients'),
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
      label: t('contracts'),
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
      label: t('notifications'),
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
        { label: t('admins'), href: '/settings/admins' },
        { label: t('services'), href: '/settings/services' },
        { label: t('hotelsAndRooms'), href: '/settings/hotels' },
        { label: t('clientGroups'), href: '/settings/client-groups' },
      ],
    },
  ]

  // The owner sees everything (all hotels + Settings); admins get every
  // operational item but Settings.
  const visibleItems = role === 'owner'
    ? NAV_ITEMS
    : NAV_ITEMS.filter(item => item.href !== '/settings')

  // Shared transition timing so every collapsing element moves in sync.
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)'
  const labelTransition = `max-width 0.22s ${ease}, opacity 0.18s ${ease}, margin 0.22s ${ease}`

  return (
    <aside style={{
      width: collapsed ? RAIL_WIDTH : EXPANDED_WIDTH,
      minWidth: collapsed ? RAIL_WIDTH : EXPANDED_WIDTH,
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: `width 0.24s ${ease}, min-width 0.24s ${ease}`,
    }}>
      {/* Brand */}
      <div style={{
        padding: collapsed ? '1.35rem 0 1.1rem' : '1.35rem 1.25rem 1.1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: `padding 0.24s ${ease}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 11,
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: `gap 0.24s ${ease}`,
        }}>
          <div style={{
            width: 38, height: 38,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            background: '#ffffff',
            padding: '3px',
            boxSizing: 'border-box',
          }}>
            <img src="/assets/logo-safir.png" alt="Safir Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{
            overflow: 'hidden',
            maxWidth: collapsed ? 0 : 160,
            opacity: collapsed ? 0 : 1,
            whiteSpace: 'nowrap',
            transition: labelTransition,
          }}>
            <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Safir Hotel Services</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.02em' }}>{t('hotelAdmin')}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{
          padding: '0 10px',
          height: collapsed ? 0 : 22,
          marginBottom: collapsed ? 0 : 8,
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          overflow: 'hidden',
          opacity: collapsed ? 0 : 1,
          whiteSpace: 'nowrap',
          transition: `height 0.22s ${ease}, opacity 0.18s ${ease}, margin 0.22s ${ease}`,
        }}>
          {t('menu')}
        </div>
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(localized(item.href))
          const badge = 'badge' in item ? (item.badge ?? 0) : 0

          return (
            <div key={item.href}>
              <Link
                href={localized(item.href)}
                title={collapsed ? item.label : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 11,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '9px 11px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : 'var(--sidebar-text)',
                  background: isActive ? 'linear-gradient(135deg, rgba(79,110,247,0.28), rgba(124,58,237,0.22))' : 'transparent',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(124,146,255,0.25)' : 'none',
                  transition: `background 0.15s ease, gap 0.24s ${ease}, padding 0.24s ${ease}`,
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
                {isActive && !collapsed && (
                  <span style={{
                    position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 18, borderRadius: 4, background: 'var(--sidebar-active)',
                  }} />
                )}
                <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, color: isActive ? '#fff' : 'var(--sidebar-text)' }}>
                  {item.icon}
                  {/* Collapsed rail: badge shrinks to a dot on the icon corner. */}
                  {collapsed && badge > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      minWidth: 8, height: 8,
                      borderRadius: 9,
                      background: 'var(--danger)',
                      boxShadow: '0 0 0 2px var(--sidebar-bg)',
                    }} />
                  )}
                </span>
                <span style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  maxWidth: collapsed ? 0 : 200,
                  opacity: collapsed ? 0 : 1,
                  whiteSpace: 'nowrap',
                  transition: labelTransition,
                }}>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badge > 0 && (
                    <span style={{
                      marginLeft: 8,
                      minWidth: 18, height: 18, padding: '0 5px',
                      borderRadius: 9,
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: '0.68rem', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(239,68,68,0.45)',
                    }}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                  {item.href === '/settings' && (
                    <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.5)', display: 'inline-flex', transform: isActive ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  )}
                </span>
              </Link>

              {/* Sub-items for settings — only shown when expanded */}
              {item.children && isActive && !collapsed && (
                <div style={{ marginLeft: 28, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {item.children.map(child => {
                    const childHref = localized(child.href)
                    const childActive = pathname === childHref || pathname.startsWith(childHref)
                    return (
                      <Link
                        key={child.href}
                        href={childHref}
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
                          whiteSpace: 'nowrap',
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

      {/* Bottom: account, language, logout, and the collapse / expand toggle */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: collapsed ? '0.6rem 0' : '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: collapsed ? 'center' : 'stretch',
        transition: `padding 0.24s ${ease}`,
      }}>
        {/* Account */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '2px',
          transition: `gap 0.24s ${ease}`,
        }}>
          <div
            title={collapsed ? `${userName} · ${accountContext}` : undefined}
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 3px 8px rgba(79,110,247,0.35)',
              flexShrink: 0,
            }}
          >
            {(userName.charAt(0) || '?').toUpperCase()}
          </div>
          <div style={{
            overflow: 'hidden',
            flex: 1,
            minWidth: 0,
            maxWidth: collapsed ? 0 : 200,
            opacity: collapsed ? 0 : 1,
            transition: labelTransition,
          }}>
            <div style={{
              color: '#fff', fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.25,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {userName}
            </div>
            <div style={{
              color: 'var(--sidebar-active, #8ea2ff)', fontSize: '0.7rem', fontWeight: 500, lineHeight: 1.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {accountContext}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', lineHeight: 1.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {userEmail}
            </div>
          </div>
        </div>

        {/* Language segmented control — hidden in the rail */}
        {!collapsed && (
          <div style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            borderRadius: 9,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {LANGUAGES.map(l => {
              const active = l.code === lang
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code as LanguageCode)}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    background: active ? 'linear-gradient(135deg, rgba(79,110,247,0.9), rgba(124,58,237,0.85))' : 'transparent',
                    boxShadow: active ? '0 2px 6px rgba(79,110,247,0.35)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {l.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Logout + collapse toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexDirection: collapsed ? 'column' : 'row',
          width: collapsed ? 'auto' : '100%',
        }}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={t('signOut')}
            aria-label={t('signOut')}
            style={{
              flex: collapsed ? undefined : 1,
              width: collapsed ? 34 : undefined,
              height: 34,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9,
              color: 'rgba(255,255,255,0.65)',
              cursor: loggingOut ? 'default' : 'pointer',
              opacity: loggingOut ? 0.6 : 1,
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              if (loggingOut) return
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'
              ;(e.currentTarget as HTMLElement).style.color = '#fca5a5'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!collapsed && (
              <span style={{ whiteSpace: 'nowrap' }}>{t('signOut')}</span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? t('expandMenu') : t('collapseMenu')}
            aria-label={collapsed ? t('expandMenu') : t('collapseMenu')}
            style={{
              width: 34, height: 34,
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9,
              color: 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'
              ;(e.currentTarget as HTMLElement).style.color = '#fff'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: `transform 0.24s ${ease}` }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
