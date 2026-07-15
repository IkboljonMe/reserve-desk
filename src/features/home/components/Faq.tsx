import { FAQS, cardStyle, sectionTitle, sectionSub, INK, MUTED, type Translate } from '../constants'

export function Faq({ t }: { t: Translate }) {
  return (
    <section id="faq" style={{ maxWidth: 800, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <h2 style={sectionTitle}>FAQ</h2>
      <p style={sectionSub}>{t('lpFaqSub')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQS.map(({ q, a }) => (
          <details key={q} style={{ ...cardStyle, padding: '1.1rem 1.4rem' }}>
            <summary style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: INK }}>{t(q)}</summary>
            <p style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.65, marginTop: 10 }}>{t(a)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
