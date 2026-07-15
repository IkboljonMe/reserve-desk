import Link from 'next/link'
import { BrandMark } from '@/components/BrandMark'
import { LandingLangToggle } from './LandingLangToggle'
import { LandingMobileMenu } from './LandingMobileMenu'
import { ACCENT, ACCENT_DARK, INK, MUTED, DISPLAY_FONT, type Translate } from '../constants'

interface Props {
  locale: string
  t: Translate
  demoUrl: string
  loginHref: string
  navLinks: { href: string; label: string }[]
}

export function Navbar({ locale, t, demoUrl, loginHref, navLinks }: Props) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e2e8f0',
    }}>
      <div style={{
        maxWidth: 1140, margin: '0 auto', padding: '0.8rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: DISPLAY_FONT, fontWeight: 400, fontSize: '1.15rem', color: INK }}>
          <BrandMark size={42} priority />
          Bronit
        </div>

        <nav style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="lp-nav-links">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} style={{
                padding: '7px 12px', borderRadius: 8, textDecoration: 'none',
                color: MUTED, fontSize: '0.875rem', fontWeight: 500,
              }}>
                {label}
              </a>
            ))}
          </div>
          <LandingLangToggle current={locale} />
          <div className="lp-nav-desktop-cta">
            <Link href={loginHref} style={{
              padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
              background: '#fff', color: INK, border: '1px solid #e2e8f0',
              fontSize: '0.875rem', fontWeight: 600,
            }}>
              {t('signIn')}
            </Link>
            <a href={demoUrl} style={{
              padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff',
              fontSize: '0.875rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(79,110,247,0.3)',
            }}>
              {t('lpTryFree')}
            </a>
          </div>
          <LandingMobileMenu
            links={navLinks}
            signInHref={loginHref}
            signInLabel={t('signIn')}
            demoHref={demoUrl}
            demoLabel={t('lpTryFree')}
          />
        </nav>
      </div>
    </header>
  )
}
