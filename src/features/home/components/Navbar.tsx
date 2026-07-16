import Link from 'next/link'
import { BrandMark } from '@/components/BrandMark'
import { LandingLangToggle } from './LandingLangToggle'
import { LandingMobileMenu } from './LandingMobileMenu'
import { DISPLAY_FONT, type Translate } from '../constants'

interface Props {
  locale: string
  t: Translate
  demoUrl: string
  loginHref: string
  navLinks: { href: string; label: string }[]
}

export function Navbar({ locale, t, demoUrl, loginHref, navLinks }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-285 mx-auto px-6 py-[0.8rem] flex items-center gap-5 flex-wrap">
        <div
          className="flex items-center gap-2.5 font-normal text-[1.15rem] text-slate-900"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          <BrandMark size={42} priority />
          Bronit
        </div>

        <nav className="flex gap-2 ml-auto items-center flex-wrap">
          <div className="lp-nav-links">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="px-3 py-1.75 rounded-lg no-underline text-slate-500 text-sm font-medium"
              >
                {label}
              </a>
            ))}
          </div>
          <LandingLangToggle current={locale} />
          <div className="lp-nav-desktop-cta">
            <Link
              href={loginHref}
              className="px-4 py-2 rounded-[10px] no-underline bg-white text-slate-900 border border-slate-200 text-sm font-semibold"
            >
              {t('signIn')}
            </Link>
            <a
              href={demoUrl}
              className="px-4 py-2 rounded-[10px] no-underline bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white text-sm font-bold shadow-[0_4px_12px_rgba(79,110,247,0.3)]"
            >
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
