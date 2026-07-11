import Link from 'next/link'
import {
  CalendarDays, LayoutDashboard, Building2, Users, FileText,
  Languages, ShieldCheck, TrendingUp, Clock4, Percent, ChevronRight,
  Sparkles, Send,
} from 'lucide-react'
import { getT } from '@/i18n/dictionary'
import { LOCALES } from '@/i18n/config'

const ACCENT = '#4f6ef7'
const ACCENT_DARK = '#3b5bdb'
const INK = '#0f172a'
const MUTED = '#64748b'

const STATS = [
  { icon: TrendingUp, value: '+25%', key: 'lpStatRevenue' },
  { icon: Clock4, value: '3h', key: 'lpStatHours' },
  { icon: Percent, value: '95%', key: 'lpStatOccupancy' },
  { icon: Sparkles, value: '24/7', key: 'lpStatAlways' },
] as const

const MODULES = [
  { icon: LayoutDashboard, key: 'lpModDashboard' },
  { icon: CalendarDays, key: 'lpModCalendar' },
  { icon: Building2, key: 'lpModHotels' },
  { icon: Users, key: 'lpModClients' },
  { icon: FileText, key: 'lpModContracts' },
  { icon: Send, key: 'lpModTelegram' },
  { icon: Languages, key: 'lpModLanguages' },
  { icon: ShieldCheck, key: 'lpModRoles' },
] as const

const REVIEWS = [
  { name: 'Dilshod Rahimov', hotelKey: 'lpReview1Hotel', quoteKey: 'lpReview1Quote', initial: 'D' },
  { name: 'Nilufar Karimova', hotelKey: 'lpReview2Hotel', quoteKey: 'lpReview2Quote', initial: 'N' },
  { name: 'Sherzod Tashkentov', hotelKey: 'lpReview3Hotel', quoteKey: 'lpReview3Quote', initial: 'S' },
] as const

const PLANS = [
  { key: 'standard', price: '100 000', highlight: false, features: ['lpPlanF1', 'lpPlanF2', 'lpPlanF3'] },
  { key: 'pro', price: '200 000', highlight: true, features: ['lpPlanF1', 'lpPlanF2', 'lpPlanF3', 'lpPlanF4', 'lpPlanF5'] },
  { key: 'vip', price: '300 000', highlight: false, features: ['lpPlanF1', 'lpPlanF2', 'lpPlanF3', 'lpPlanF4', 'lpPlanF5', 'lpPlanF6'] },
] as const

const FAQS = [
  { q: 'lpFaq1Q', a: 'lpFaq1A' },
  { q: 'lpFaq2Q', a: 'lpFaq2A' },
  { q: 'lpFaq3Q', a: 'lpFaq3A' },
  { q: 'lpFaq4Q', a: 'lpFaq4A' },
] as const

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = getT(locale)
  const L = (path: string) => `/${locale}${path}`

  const sectionTitle: React.CSSProperties = {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em',
    textAlign: 'center', color: INK, marginBottom: 10,
  }
  const sectionSub: React.CSSProperties = {
    textAlign: 'center', color: MUTED, maxWidth: 620, margin: '0 auto 2.5rem', fontSize: '1rem', lineHeight: 1.6,
  }
  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.04)',
  }

  return (
    <main style={{ background: '#f8fafc', color: INK, minHeight: '100dvh' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto', padding: '0.8rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.05rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${ACCENT} 0%, #7c3aed 100%)`,
              boxShadow: '0 4px 12px rgba(79,110,247,0.35)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            Easy Service
          </div>

          <nav style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
            {([['#features', 'lpNavFeatures'], ['#reviews', 'lpNavReviews'], ['#pricing', 'lpNavPricing'], ['#faq', 'FAQ']] as const).map(([href, key]) => (
              <a key={href} href={href} style={{
                padding: '7px 12px', borderRadius: 8, textDecoration: 'none',
                color: MUTED, fontSize: '0.875rem', fontWeight: 500,
              }}>
                {key === 'FAQ' ? 'FAQ' : t(key)}
              </a>
            ))}
            <Link href={L('/login')} style={{
              marginLeft: 6, padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
              background: '#fff', color: INK, border: '1px solid #e2e8f0',
              fontSize: '0.875rem', fontWeight: 600,
            }}>
              {t('signIn')}
            </Link>
            <Link href={L('/demo')} style={{
              padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff',
              fontSize: '0.875rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(79,110,247,0.3)',
            }}>
              {t('lpTryFree')}
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        maxWidth: 1140, margin: '0 auto', padding: '4.5rem 1.5rem 3rem', textAlign: 'center',
        background: `
          radial-gradient(700px 380px at 85% -20%, rgba(124,58,237,0.08), transparent 60%),
          radial-gradient(700px 380px at 10% -10%, rgba(79,110,247,0.10), transparent 55%)`,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
          padding: '6px 14px', borderRadius: 999, background: '#eef2ff', border: '1px solid #e0e7ff',
          color: ACCENT_DARK, fontSize: '0.8rem', fontWeight: 600,
        }}>
          <Sparkles size={14} /> {t('lpHeroBadge')}
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.12, maxWidth: 820, margin: '0 auto 1.25rem', color: INK,
        }}>
          {t('lpHeroTitle1')}{' '}
          <span style={{
            background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`,
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>
            {t('lpHeroTitle2')}
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: MUTED, maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.65 }}>
          {t('lpHeroSubtitle')}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <Link href={L('/demo')} style={{
            padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff',
            fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 24px rgba(79,110,247,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            {t('lpHeroCta')} <ChevronRight size={18} />
          </Link>
          <a href="#pricing" style={{
            padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
            background: '#fff', color: INK, border: '1px solid #e2e8f0',
            fontWeight: 600, fontSize: '1rem',
          }}>
            {t('pricingTitle')}
          </a>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14,
          maxWidth: 860, margin: '0 auto',
        }}>
          {STATS.map(({ icon: Icon, value, key }) => (
            <div key={key} style={{ ...card, padding: '1.1rem 1rem', textAlign: 'center' }}>
              <Icon size={20} color={ACCENT} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: MUTED, marginTop: 2 }}>{t(key)}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 12 }}>{t('lpStatsDisclaimer')}</p>
      </section>

      {/* ── Product pillars ─────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <h2 style={sectionTitle}>{t('lpPillarsTitle')}</h2>
        <p style={sectionSub}>{t('lpPillarsSub')}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {([
            { icon: LayoutDashboard, title: 'lpPillar1Title', desc: 'lpPillar1Desc', points: ['lpPillar1P1', 'lpPillar1P2', 'lpPillar1P3'] },
            { icon: CalendarDays, title: 'lpPillar2Title', desc: 'lpPillar2Desc', points: ['lpPillar2P1', 'lpPillar2P2', 'lpPillar2P3'] },
            { icon: Building2, title: 'lpPillar3Title', desc: 'lpPillar3Desc', points: ['lpPillar3P1', 'lpPillar3P2', 'lpPillar3P3'] },
          ] as const).map(({ icon: Icon, title, desc, points }) => (
            <div key={title} style={{ ...card, padding: '1.75rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#eef2ff', color: ACCENT,
              }}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{t(title)}</h3>
              <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 14 }}>{t(desc)}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {points.map(p => (
                  <li key={p} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.85rem', color: '#334155' }}>
                    <ShieldCheck size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                    {t(p)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ─────────────────────────────────────────────────────── */}
      <section id="reviews" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
          <h2 style={sectionTitle}>{t('lpReviewsTitle')}</h2>
          <p style={sectionSub}>{t('lpReviewsSub')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {REVIEWS.map(r => (
              <div key={r.name} style={{ ...card, background: '#f8fafc', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ color: '#f59e0b', letterSpacing: 2, fontSize: '0.9rem' }}>★★★★★</div>
                <p style={{ color: '#334155', fontSize: '0.925rem', lineHeight: 1.65, flex: 1 }}>
                  “{t(r.quoteKey)}”
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700,
                  }}>
                    {r.initial}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div>
                    <div style={{ color: MUTED, fontSize: '0.78rem' }}>{t(r.hotelKey)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules grid ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <h2 style={sectionTitle}>{t('lpModulesTitle')}</h2>
        <p style={sectionSub}>{t('lpModulesSub')}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {MODULES.map(({ icon: Icon, key }) => (
            <div key={key} style={{ ...card, padding: '1.2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#eef2ff', color: ACCENT,
              }}>
                <Icon size={19} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t(`${key}Title`)}</div>
                <div style={{ color: MUTED, fontSize: '0.78rem', marginTop: 2 }}>{t(`${key}Desc`)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
          <h2 style={sectionTitle}>{t('pricingTitle')}</h2>
          <p style={sectionSub}>{t('lpPricingSub')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'stretch' }}>
            {PLANS.map(plan => (
              <div key={plan.key} style={{
                ...card,
                padding: '1.9rem',
                position: 'relative',
                display: 'flex', flexDirection: 'column',
                ...(plan.highlight ? {
                  border: `2px solid ${ACCENT}`,
                  boxShadow: '0 12px 36px rgba(79,110,247,0.18)',
                } : {}),
              }}>
                {plan.highlight && (
                  <span style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, color: '#fff',
                    fontSize: '0.72rem', fontWeight: 700, padding: '4px 14px', borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}>
                    {t('mostPopular')}
                  </span>
                )}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 4 }}>{t(`plan_${plan.key}`)}</h3>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {plan.price}
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: MUTED }}> {t('lpUzsPerMonth')}</span>
                </div>
                <p style={{ color: MUTED, fontSize: '0.83rem', marginBottom: 18 }}>{t(`plan_${plan.key}_desc`)}</p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.85rem', color: '#334155' }}>
                      <ShieldCheck size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                      {t(f)}
                    </li>
                  ))}
                </ul>

                <Link href={L('/demo')} style={{
                  display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 10, textDecoration: 'none',
                  fontWeight: 700, fontSize: '0.9rem',
                  ...(plan.highlight
                    ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff', boxShadow: '0 6px 18px rgba(79,110,247,0.3)' }
                    : { background: '#eef2ff', color: ACCENT_DARK }),
                }}>
                  {t('lpTryFree')}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: MUTED, fontSize: '0.83rem', marginTop: 20 }}>
            {t('lpPricingContact')}
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: 800, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <h2 style={sectionTitle}>FAQ</h2>
        <p style={sectionSub}>{t('lpFaqSub')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map(({ q, a }) => (
            <details key={q} style={{ ...card, padding: '1.1rem 1.4rem' }}>
              <summary style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: INK }}>{t(q)}</summary>
              <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.65, marginTop: 10 }}>{t(a)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <div style={{
          borderRadius: 22, padding: '3rem 2rem', textAlign: 'center',
          background: `linear-gradient(135deg, #14192a 0%, #1e2540 60%, #2a1e55 100%)`,
          boxShadow: '0 24px 60px rgba(15,23,42,0.35)',
        }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
            {t('lpFinalCtaTitle')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 540, margin: '0 auto 1.75rem', fontSize: '0.975rem', lineHeight: 1.6 }}>
            {t('lpFinalCtaSub')}
          </p>
          <Link href={L('/demo')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 30px', borderRadius: 12, textDecoration: 'none',
            background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, color: '#fff',
            fontWeight: 700, boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
          }}>
            {t('lpHeroCta')} <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto', padding: '2rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ color: MUTED, fontSize: '0.83rem' }}>
            © {new Date().getFullYear()} Easy Service · easy-service.uz
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <Link href={L('/demo')} style={{ color: MUTED, fontSize: '0.83rem', textDecoration: 'none' }}>{t('viewDemo')}</Link>
            <a href="#pricing" style={{ color: MUTED, fontSize: '0.83rem', textDecoration: 'none' }}>{t('pricingTitle')}</a>
            <Link href={L('/login')} style={{ color: MUTED, fontSize: '0.83rem', textDecoration: 'none' }}>{t('signIn')}</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
