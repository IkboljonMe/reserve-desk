import { LayoutDashboard, CalendarDays, Users, Settings2 } from 'lucide-react'
import DemoEntryClient from './DemoEntryClient'
import { getT } from '@/i18n/dictionary'

// The demo is a real seeded tenant ("Demo Hotel Group") — this page explains
// what the visitor is about to see and drops them into its OWNER account.
export default async function DemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getT(locale)

  const points = [
    { icon: LayoutDashboard, key: 'demoPoint1' },
    { icon: CalendarDays, key: 'demoPoint2' },
    { icon: Users, key: 'demoPoint3' },
    { icon: Settings2, key: 'demoPoint4' },
  ] as const

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: `
        radial-gradient(900px 500px at 80% -10%, rgba(124,58,237,0.35), transparent 60%),
        radial-gradient(800px 500px at 10% 110%, rgba(79,110,247,0.30), transparent 55%),
        linear-gradient(135deg, #14192a 0%, #1e2540 50%, #14192a 100%)`,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            {t('demoTitle')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {t('demoOwnerSubtitle')}
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: '1.75rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {points.map(({ icon: Icon, key }) => (
              <li key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(99,102,241,0.25)', color: '#a5b4fc',
                }}>
                  <Icon size={15} />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>

          <DemoEntryClient />
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: 14, lineHeight: 1.5 }}>
          {t('demoResetNote')}
        </p>
      </div>
    </main>
  )
}
