import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { ToastProvider } from '@/components/ToastProvider'
import LogoutButton from './LogoutButton'

// proxy.ts already gates this tree to superadmin sessions — this check is
// defense in depth in case the layout is ever reached directly.
export default async function SuperadminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()
  if (!session || session.role !== 'superadmin') {
    redirect(`/${locale}/secure/superadmin/login`)
  }

  return (
    <ToastProvider>
      <div style={{ minHeight: '100dvh', background: 'var(--surface-card)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--surface-border)',
          background: '#14192a',
        }}>
          <div style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
            Bronit — Superadmin
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>{session.name}</span>
            <LogoutButton />
          </div>
        </div>
        <main style={{ padding: '1.75rem 2rem', maxWidth: 960, margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
