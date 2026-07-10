'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useTranslation } from '@/i18n'
import type { SessionRole } from '@/lib/session'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
  role: SessionRole
  hotelName: string
}

export default function DashboardContainer({ children, userName, userEmail, role, hotelName }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const { t } = useTranslation()

  // Close the off-canvas nav whenever the route changes (adjusted during
  // render, not an effect, to avoid an extra post-navigation frame).
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setMobileNavOpen(false)
  }

  return (
    <div style={{ height: '100dvh', position: 'relative' }}>
      {/* Full-bleed shell: sidebar + content fill the viewport edge-to-edge with
          no outer frame, so nothing reads as a floating card. */}
      <div style={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Thin brand accent strip across the very top. */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'var(--brand-gradient)',
          zIndex: 2,
        }} />

        {isMobile && mobileNavOpen && (
          <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />
        )}

        <Sidebar
          collapsed={isMobile ? false : collapsed}
          role={role}
          onToggle={() => setCollapsed(!collapsed)}
          userName={userName}
          userEmail={userEmail}
          hotelName={hotelName}
          mobile={isMobile}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div className="mobile-topbar" style={{
            alignItems: 'center',
            gap: 12,
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--surface-border)',
            background: 'var(--surface-card)',
          }}>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t('openMenuAria')}
              style={{
                width: 38, height: 38, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 9, border: '1px solid var(--gray-200)', background: '#fff',
                color: 'var(--gray-700)', cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gray-800)', letterSpacing: '-0.01em' }}>Easy Service</div>
          </div>

          <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? '1.1rem' : '1.75rem 2rem', background: 'var(--surface-card)' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
