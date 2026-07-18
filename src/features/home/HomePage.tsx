import { headers } from 'next/headers'
import { getT } from '@/i18n/dictionary'
import { JsonLd } from '@/components/JsonLd'
import { connectDB } from '@/lib/mongodb'
import { Plan } from '@/models/Plan'
import { planDescriptionFor, type FeatureKey } from '@/lib/planFeatures'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Reviews } from './components/Reviews'
import { Modules } from './components/Modules'
import { Pricing, type PricingPlan } from './components/Pricing'
import { Faq } from './components/Faq'
import { FinalCta } from './components/FinalCta'
import { Footer } from './components/Footer'
import { ContactWidget } from './components/ContactWidget'

// The marketing landing page. Server component: resolves translations + the
// request host (for cross-subdomain links), then composes the sections.
export async function HomePage({ locale }: { locale: string }) {
  const t = getT(locale)
  const loginHref = `/${locale}/login`

  // Cross-subdomain links. The marketing site lives on the root domain; the demo
  // runs on the `demo.` subdomain, so build an absolute URL to it from the request
  // host (works for prod `bronit.uz` and local `bronit.test:3000` alike).
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

  // Pricing is data-driven from the superadmin-managed Plans in the DB.
  await connectDB()
  const planDocs = await Plan.find()
    .select('key name price description features highlight sortOrder')
    .sort({ sortOrder: 1, price: 1, createdAt: 1 })
    .lean()
  const plans: PricingPlan[] = planDocs.map(p => ({
    key: p.key,
    name: p.name,
    price: p.price ?? 0,
    // Resolve the trilingual description to the landing page's language.
    description: planDescriptionFor(p.description as Parameters<typeof planDescriptionFor>[0], locale),
    features: (p.features ?? []) as FeatureKey[],
    highlight: !!p.highlight,
  }))

  // Structured data for rich results, from the same plan prices.
  const prices = plans.map(p => p.price).filter(p => p > 0)
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bronit',
    url: 'https://bronit.uz',
    logo: 'https://bronit.uz/assets/bronit-logo.png',
  }
  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Bronit',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: t('metaDescription'),
    url: `https://bronit.uz/${locale}`,
    offers: prices.length ? {
      '@type': 'AggregateOffer',
      priceCurrency: 'UZS',
      lowPrice: String(Math.min(...prices)),
      highPrice: String(Math.max(...prices)),
      offerCount: plans.length,
    } : undefined,
  }

  return (
    <main className="bg-[var(--surface-bg)] text-[var(--gray-900)] min-h-dvh overflow-x-clip transition-colors duration-200">
      <JsonLd data={organizationLd} />
      <JsonLd data={softwareLd} />
      <Navbar locale={locale} t={t} demoUrl={demoUrl} loginHref={loginHref} navLinks={navLinks} />
      <Hero t={t} demoUrl={demoUrl} />
      <div className="relative bg-[var(--surface-bg)] transition-colors duration-200">
        <Features t={t} />
        <Reviews t={t} />
        <Modules t={t} />
        <Pricing t={t} demoUrl={demoUrl} plans={plans} />
        <Faq t={t} />
        <FinalCta t={t} demoUrl={demoUrl} />
        <Footer t={t} demoUrl={demoUrl} loginHref={loginHref} />
      </div>

      <ContactWidget
        title={t('lpContactTitle')}
        desc={t('lpContactDesc')}
        namePlaceholder={t('lpContactName')}
        phonePlaceholder={t('lpContactPhone')}
        submitLabel={t('lpContactSubmit')}
        sendingLabel={t('lpContactSending')}
        successMsg={t('lpContactSuccess')}
        errorMsg={t('lpContactError')}
        closeLabel={t('close')}
      />
    </main>
  )
}
