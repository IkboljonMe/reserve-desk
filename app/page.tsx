'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { nowUZ } from '@/lib/timezone'
import Link from 'next/link'

interface DashboardStats {
  totalBookings: number
  todayBookings: number
  activeServices: number
}

export default function RootPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  
  useEffect(() => {
    // In a real app we'd fetch actual aggregated data, but we'll fetch existing lists
    async function loadStats() {
      const today = format(nowUZ(), 'yyyy-MM-dd')
      const [bookRes, servRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/services')
      ])
      const bookings = await bookRes.json()
      const services = await servRes.json()
      
      const todayCount = (Array.isArray(bookings) ? bookings : []).filter(b => b.date === today).length
      
      setStats({
        totalBookings: Array.isArray(bookings) ? bookings.length : 0,
        todayBookings: todayCount,
        activeServices: Array.isArray(services) ? services.filter(s => s.isActive).length : 0
      })
    }
    loadStats()
  }, [])

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Welcome back! Here's what is happening today.</p>
        </div>
        <Link href="/book" className="btn btn-primary" style={{ animation: 'slideUp 0.3s ease 0.1s both' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Booking
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        {/* Stat Cards */}
        {[ 
          { label: "Today's Guests", value: stats?.todayBookings ?? '-', delay: '0.1s' },
          { label: "Total Reservations", value: stats?.totalBookings ?? '-', delay: '0.15s' },
          { label: "Active Services", value: stats?.activeServices ?? '-', delay: '0.2s' }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ 
            animation: `slideUp 0.4s ease ${stat.delay} both`,
            display: 'flex', flexDirection: 'column', gap: '0.25rem'
          }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>
              {stat.label}
            </h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-600)' }}>
              {stat.value}
            </div>
            {stats && <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>↓ Updates live</div>}
          </div>
        ))}
      </div>
      
      {/* Visual Chart Placeholder */}
      <div className="card" style={{ marginTop: '1.5rem', animation: 'slideUp 0.4s ease 0.3s both', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1rem' }}>Activity Timeline</h3>
        <div style={{ flex: 1, border: '2px dashed var(--surface-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', color: 'var(--gray-400)' }}>
          Real-time activity visualization will appear here.
        </div>
      </div>
    </div>
  )
}
