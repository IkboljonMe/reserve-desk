'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
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

  return (
    <div style={{ height: '100dvh', padding: 12, boxSizing: 'border-box', position: 'relative' }}>
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

        <Sidebar
          collapsed={collapsed}
          role={role}
          onToggle={() => setCollapsed(!collapsed)}
          userName={userName}
          userEmail={userEmail}
          hotelName={hotelName}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: 'var(--gray-50)' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
