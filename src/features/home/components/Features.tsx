import { ShieldCheck } from 'lucide-react'
import { PILLARS, cardStyle, sectionTitle, sectionSub, ACCENT, MUTED, type Translate } from '../constants'

export function Features({ t }: { t: Translate }) {
  return (
    <section id="features" style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <h2 style={sectionTitle}>{t('lpPillarsTitle')}</h2>
      <p style={sectionSub}>{t('lpPillarsSub')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {PILLARS.map(({ icon: Icon, title, desc, points }) => (
          <div key={title} style={{ ...cardStyle, padding: '1.75rem' }}>
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
  )
}
