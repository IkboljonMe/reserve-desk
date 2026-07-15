import { REVIEWS, cardStyle, sectionTitle, sectionSub, ACCENT, MUTED, type Translate } from '../constants'

export function Reviews({ t }: { t: Translate }) {
  return (
    <section id="reviews" style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <h2 style={sectionTitle}>{t('lpReviewsTitle')}</h2>
        <p style={sectionSub}>{t('lpReviewsSub')}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {REVIEWS.map(r => (
            <div key={r.name} style={{ ...cardStyle, background: '#f8fafc', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
  )
}
