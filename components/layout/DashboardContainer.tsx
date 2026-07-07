'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'

interface Props {
  children: React.ReactNode
  userName: string
  userEmail: string
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

export default function DashboardContainer({ children, userName, userEmail }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      <Suspense fallback={null}>
        <LoaderTrigger setLoading={setLoading} />
      </Suspense>

      <Sidebar collapsed={collapsed} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header 
          userName={userName} 
          userEmail={userEmail} 
          onToggleSidebar={() => setCollapsed(!collapsed)} 
          sidebarCollapsed={collapsed}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: 'var(--body-bg, #f8f9fa)' }}>
          {children}
        </main>
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
