'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import type { SessionRole } from '@/lib/session'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
  role: SessionRole
}

function LoaderTrigger({ setLoading }: { setLoading: (val: boolean) => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setLoading(false)
  }, [pathname, searchParams, setLoading])

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const anchor = target.closest('a')
      if (anchor && anchor.href && anchor.target !== '_blank') {
        try {
          const url = new URL(anchor.href)
          const currentUrl = new URL(window.location.href)
          if (
            url.origin === currentUrl.origin &&
            (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search)
          ) {
            setLoading(true)
          }
        } catch {
          // ignore invalid URLs
        }
      }
    }
    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [setLoading])

  return null
}

export default function DashboardContainer({ children, userName, userEmail, role }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ height: '100dvh', padding: 12, boxSizing: 'border-box', position: 'relative' }}>
      <Suspense fallback={null}>
        <LoaderTrigger setLoading={setLoading} />
      </Suspense>

      {/* Shell: sidebar + content share one rounded, shadowed frame so the two
          tones (dark sidebar / light content) read as one connected surface
          instead of two independent full-bleed panels. */}
      <div style={{
        display: 'flex',
        height: '100%',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--surface-border)',
        position: 'relative',
      }}>
        {/* Brand accent strip spans the top of both the sidebar and the
            content, tying the two halves into one visual system. */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'var(--brand-gradient)',
          zIndex: 2,
        }} />

        <Sidebar collapsed={collapsed} role={role} onToggle={() => setCollapsed(!collapsed)} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Header
            userName={userName}
            userEmail={userEmail}
            onToggleSidebar={() => setCollapsed(!collapsed)}
            sidebarCollapsed={collapsed}
          />
          <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: 'var(--gray-50)' }}>
            {children}
          </main>
        </div>
      </div>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(20, 25, 42, 0.4)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
        }}>
          <div className="spinner" style={{ width: 44, height: 44, borderTopColor: 'var(--brand-500, #6366f1)' }} />
        </div>
      )}
    </div>
  )
}
