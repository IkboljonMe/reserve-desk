import Link from 'next/link'
import { getT } from '@/i18n/dictionary'

const PLANS = [
  { key: 'standard', price: '100 000', highlight: false },
  { key: 'pro', price: '200 000', highlight: true },
  { key: 'vip', price: '300 000', highlight: false },
] as const

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getT(locale)
  const L = (path: string) => `/${locale}${path}`

  return (
    <main style={{ minHeight: '100dvh', background: '#0b0f1a', color: '#fff' }}>
      {/* Nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem', maxWidth: 1100, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          Easy Service
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href={L('/demo')} className="btn btn-secondary btn-sm">{t('viewDemo')}</Link>
          <Link href={L('/secure/superadmin/login')} className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('signIn')}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section style={{
        padding: '4rem 2rem 5rem',
        maxWidth: 1100, margin: '0 auto',
        textAlign: 'center',
        background: `
          radial-gradient(900px 500px at 80% -10%, rgba(124,58,237,0.35), transparent 60%),
          radial-gradient(800px 500px at 10% 20%, rgba(79,110,247,0.25), transparent 55%)`,
      }}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem' }}>
          {t('landingHeroTitle')}
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.65)', maxWidth: 640, margin: '0 auto 2rem' }}>
          {t('landingHeroSubtitle')}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={L('/demo')} className="btn btn-primary btn-lg">{t('viewDemo')}</Link>
          <Link href={L('/secure/superadmin/login')} className="btn btn-secondary btn-lg">{t('getStarted')}</Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '2rem 2rem 4rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>
          {t('howItWorksTitle')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {(['step1', 'step2', 'step3'] as const).map((key, i) => (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '1.5rem',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                fontWeight: 700, marginBottom: 12,
              }}>
                {i + 1}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{t(`landing${key}Title`)}</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>{t(`landing${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '2rem 2rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>
          {t('pricingTitle')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {PLANS.map(plan => (
            <div
              key={plan.key}
              style={{
                background: plan.highlight ? 'linear-gradient(160deg, rgba(99,102,241,0.25), rgba(124,58,237,0.15))' : 'rgba(255,255,255,0.05)',
                border: plan.highlight ? '1.5px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 18, padding: '1.75rem',
                position: 'relative',
              }}
            >
              {plan.highlight && (
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#7c3aed', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                  padding: '3px 10px', borderRadius: 999,
                }}>
                  {t('mostPopular')}
                </span>
              )}
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 4 }}>{t(`plan_${plan.key}`)}</h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>
                {plan.price} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>{t('perMonthUzs')}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
                {t(`plan_${plan.key}_desc`)}
              </p>
              <Link href={L('/secure/superadmin/login')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {t('getStarted')}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer style={{
        padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)',
        fontSize: '0.8125rem', borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        © {new Date().getFullYear()} Easy Service · easy-service.uz
      </footer>
    </main>
  )
}
