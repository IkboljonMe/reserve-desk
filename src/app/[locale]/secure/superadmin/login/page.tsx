import LoginFormClient from '@/components/auth/LoginFormClient'
import { getT } from '@/i18n/dictionary'

export default async function SuperadminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getT(locale)
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(900px 500px at 80% -10%, rgba(124,58,237,0.35), transparent 60%),
        radial-gradient(800px 500px at 10% 110%, rgba(79,110,247,0.30), transparent 55%),
        linear-gradient(135deg, #14192a 0%, #1e2540 50%, #14192a 100%)`,
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
            boxShadow: '0 10px 26px rgba(99,102,241,0.45)',
            boxSizing: 'border-box',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Smartix</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{t('superadminPortal')}</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: '2rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}>
          <h2 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('signInToAccount')}</h2>
          <LoginFormClient />
        </div>
      </div>
    </main>
  )
}
