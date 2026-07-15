import { MODULES, cardStyle, sectionTitle, sectionSub, ACCENT, MUTED, type Translate } from '../constants'

export function Modules({ t }: { t: Translate }) {
  return (
    <section style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <h2 style={sectionTitle}>{t('lpModulesTitle')}</h2>
      <p style={sectionSub}>{t('lpModulesSub')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {MODULES.map(({ icon: Icon, key }) => (
          <div key={key} style={{ ...cardStyle, padding: '1.2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
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
  )
}
