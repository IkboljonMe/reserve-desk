import Link from 'next/link'
import { MUTED, type Translate } from '../constants'

export function Footer({ t, demoUrl, loginHref }: { t: Translate; demoUrl: string; loginHref: string }) {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0' }}>
      <div style={{
        maxWidth: 1140, margin: '0 auto', padding: '2rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ color: MUTED, fontSize: '0.83rem' }}>
          © {new Date().getFullYear()} Bronit · bronit.uz
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          <a href={demoUrl} style={{ color: MUTED, fontSize: '0.83rem', textDecoration: 'none' }}>{t('viewDemo')}</a>
          <a href="#pricing" style={{ color: MUTED, fontSize: '0.83rem', textDecoration: 'none' }}>{t('pricingTitle')}</a>
          <Link href={loginHref} style={{ color: MUTED, fontSize: '0.83rem', textDecoration: 'none' }}>{t('signIn')}</Link>
        </div>
      </div>
    </footer>
  )
}
