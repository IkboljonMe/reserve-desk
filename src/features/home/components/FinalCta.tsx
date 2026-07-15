import { ChevronRight } from 'lucide-react'
import { ACCENT, type Translate } from '../constants'

export function FinalCta({ t, demoUrl }: { t: Translate; demoUrl: string }) {
  return (
    <section style={{ maxWidth: 1140, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      <div className="lp-final-cta" style={{
        borderRadius: 22, padding: '3rem 2rem', textAlign: 'center',
        background: 'linear-gradient(135deg, #14192a 0%, #1e2540 60%, #2a1e55 100%)',
        boxShadow: '0 24px 60px rgba(15,23,42,0.35)',
      }}>
        <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
          {t('lpFinalCtaTitle')}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 540, margin: '0 auto 1.75rem', fontSize: '0.975rem', lineHeight: 1.6 }}>
          {t('lpFinalCtaSub')}
        </p>
        <a href={demoUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '13px 30px', borderRadius: 12, textDecoration: 'none',
          background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`, color: '#fff',
          fontWeight: 700, boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
        }}>
          {t('lpHeroCta')} <ChevronRight size={18} />
        </a>
      </div>
    </section>
  )
}
