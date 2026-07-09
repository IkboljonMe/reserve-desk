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

        <Sidebar
          collapsed={collapsed}
          role={role}
          onToggle={() => setCollapsed(!collapsed)}
          userName={userName}
          userEmail={userEmail}
          hotelName={hotelName}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <main style={{ flex: 1, overflow: 'auto', padding: '1.75rem 2rem', background: 'var(--surface-card)' }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
