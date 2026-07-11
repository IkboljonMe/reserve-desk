import DemoLoginClient from './DemoLoginClient'
import { getT } from '@/i18n/dictionary'

// The demo is entirely client-side: hardcoded fixtures + localStorage, no
// database, no real auth. This login screen is cosmetic — it just picks
// which demo hotel's data the visitor will see.
export default async function DemoLoginPage({ params }: { params: Promise<{ locale: string }> }) {
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
      <div style={{ width: '100%', maxWidth: '420px', padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{t('demoTitle')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{t('demoSubtitle')}</p>
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
          <DemoLoginClient />
        </div>
      </div>
    </main>
  )
}
