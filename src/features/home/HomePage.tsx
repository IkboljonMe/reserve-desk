import { headers } from 'next/headers'
import { getT } from '@/i18n/dictionary'
import { INK } from './constants'
import { LandingStyles } from './components/LandingStyles'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Reviews } from './components/Reviews'
import { Modules } from './components/Modules'
import { Pricing } from './components/Pricing'
import { Faq } from './components/Faq'
import { FinalCta } from './components/FinalCta'
import { Footer } from './components/Footer'

// The marketing landing page. Server component: resolves translations + the
// request host (for cross-subdomain links), then composes the sections.
export async function HomePage({ locale }: { locale: string }) {
  const t = getT(locale)
  const loginHref = `/${locale}/login`

  // Cross-subdomain links. The marketing site lives on the root domain; the demo
  // runs on the `demo.` subdomain, so build an absolute URL to it from the request
  // host (works for prod `smartix.uz` and local `smartix.test:3000` alike).
  const reqHeaders = await headers()
  const host = reqHeaders.get('host') || ''
  const protocol = reqHeaders.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('.test') ? 'http' : 'https')
  const baseDomain = host.replace(/^(www|app|admin|super|demo)\./, '')
  const demoUrl = `${protocol}://demo.${baseDomain}/${locale}/demo`

  // In-page section links, shared by the desktop nav and the mobile drawer.
  const navLinks = [
    { href: '#features', label: t('lpNavFeatures') },
    { href: '#reviews', label: t('lpNavReviews') },
    { href: '#pricing', label: t('lpNavPricing') },
    { href: '#faq', label: 'FAQ' },
  ]

  return (
    <main className="lp-main" style={{ background: '#f8fafc', color: INK, minHeight: '100dvh', overflowX: 'clip' }}>
      <LandingStyles />
      <Navbar locale={locale} t={t} demoUrl={demoUrl} loginHref={loginHref} navLinks={navLinks} />
      <Hero t={t} demoUrl={demoUrl} />
      <Features t={t} />
      <Reviews t={t} />
      <Modules t={t} />
      <Pricing t={t} demoUrl={demoUrl} />
      <Faq t={t} />
      <FinalCta t={t} demoUrl={demoUrl} />
      <Footer t={t} demoUrl={demoUrl} loginHref={loginHref} />
    </main>
  )
}
