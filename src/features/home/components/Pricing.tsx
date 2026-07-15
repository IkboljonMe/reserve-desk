import { ShieldCheck } from 'lucide-react'
import { PLANS, cardStyle, sectionTitle, sectionSub, ACCENT, ACCENT_DARK, MUTED, type Translate } from '../constants'

export function Pricing({ t, demoUrl }: { t: Translate; demoUrl: string }) {
  return (
    <section id="pricing" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <h2 style={sectionTitle}>{t('pricingTitle')}</h2>
        <p style={sectionSub}>{t('lpPricingSub')}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{
              ...cardStyle,
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

              <a href={demoUrl} style={{
                display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 10, textDecoration: 'none',
                fontWeight: 700, fontSize: '0.9rem',
                ...(plan.highlight
                  ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff', boxShadow: '0 6px 18px rgba(79,110,247,0.3)' }
                  : { background: '#eef2ff', color: ACCENT_DARK }),
              }}>
                {t('lpTryFree')}
              </a>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: MUTED, fontSize: '0.83rem', marginTop: 20 }}>
          {t('lpPricingContact')}
        </p>
      </div>
    </section>
  )
}
