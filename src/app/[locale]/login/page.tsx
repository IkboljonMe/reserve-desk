import LoginFormClient from '@/components/auth/LoginFormClient'
import { BrandMark } from '@/components/BrandMark'
import { getT } from '@/i18n/dictionary'
import { headers } from 'next/headers'
import { getSubdomain } from '@/lib/subdomain'

// On the root domain this shows selecting the owner/admin portal,
// while on correct subdomains it displays the real login form.
export default async function UniversalLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getT(locale)
  const reqHeaders = await headers()
  const host = reqHeaders.get('host') || ''
  const sub = getSubdomain(host)
  
  const protocol = reqHeaders.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') ? 'http' : 'https')
  const baseDomain = host.replace(/^(www|app|admin|super|demo)\./, '')
  // Marketing site lives on the root domain — link back to it from any portal.
  const homeUrl = `${protocol}://${baseDomain}/${locale}`

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
          <a href={homeUrl} style={{ textDecoration: 'none', display: 'inline-block' }} aria-label={t('backToHome')}>
            <BrandMark size={64} priority style={{ margin: '0 auto 0.75rem' }} />
            <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Smartix</h1>
          </a>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{t('universalLoginHint')}</p>
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
          {!sub ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, textAlign: 'center', marginBottom: '1rem' }}>Select your portal</h2>
               <a 
                 href={`${protocol}://app.${baseDomain}/${locale}/login`}
                 className="btn btn-primary"
                 style={{ textAlign: 'center', padding: '1rem', borderRadius: '12px', color: '#fff', textDecoration: 'none' }}
               >
                 Owner Portal
               </a>
               <a 
                 href={`${protocol}://admin.${baseDomain}/${locale}/login`}
                 className="btn btn-secondary"
                 style={{ textAlign: 'center', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none' }}
               >
                 Branch Admin Portal
               </a>
               <a 
                 href={`${protocol}://super.${baseDomain}/${locale}/login`}
                 style={{ textAlign: 'center', padding: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '1rem', textDecoration: 'none' }}
               >
                 Superadmin Login
               </a>
             </div>
          ) : (
             <>
               <h2 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{t('signInToAccount')}</h2>
               <LoginFormClient />
             </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href={homeUrl} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← {t('backToHome')}
          </a>
        </div>
      </div>
    </main>
  )
}
