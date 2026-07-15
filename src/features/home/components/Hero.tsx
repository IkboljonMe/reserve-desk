import { ChevronRight, Sparkles } from 'lucide-react'
import { HeroBackground } from './HeroBackground'
import { BrandMark } from '@/components/BrandMark'
import { STATS, ACCENT, ACCENT_DARK, INK, MUTED, type Translate } from '../constants'

export function Hero({ t, demoUrl }: { t: Translate; demoUrl: string }) {
  return (
    <section className="lp-pad-x" style={{
      position: 'relative',
      maxWidth: 1140, margin: '0 auto', padding: '4.5rem 1.5rem 5rem', textAlign: 'center',
    }}>
      <HeroBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
          padding: '6px 14px', borderRadius: 999, background: 'rgba(79, 110, 247, 0.08)', border: '1px solid rgba(79, 110, 247, 0.15)',
          color: ACCENT_DARK, fontSize: '0.8rem', fontWeight: 600,
        }}>
          <Sparkles size={14} /> {t('lpHeroBadge')}
        </div>

        <h1 style={{
          fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.1, maxWidth: 880, margin: '0 auto 1.25rem', color: INK,
        }}>
          {t('lpHeroTitle1')}{' '}
          <span style={{
            background: `linear-gradient(135deg, ${ACCENT}, #7c3aed)`,
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>
            {t('lpHeroTitle2')}
          </span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: MUTED, maxWidth: 660, margin: '0 auto 2rem', lineHeight: 1.65 }}>
          {t('lpHeroSubtitle')}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <a href={demoUrl} className="lp-cta-full lp-btn-primary" style={{
            padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff',
            fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 24px rgba(79,110,247,0.35)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            {t('lpHeroCta')} <ChevronRight size={18} />
          </a>
          <a href="#pricing" className="lp-cta-full lp-btn-secondary" style={{
            padding: '13px 28px', borderRadius: 12, textDecoration: 'none',
            background: '#fff', color: INK, border: '1px solid #e2e8f0',
            fontWeight: 600, fontSize: '1rem',
            display: 'inline-flex', alignItems: 'center',
          }}>
            {t('pricingTitle')}
          </a>
        </div>

        {/* Dashboard Mockup Container */}
        <div className="lp-mockup-wrapper" style={{
          position: 'relative',
          maxWidth: 960,
          margin: '0 auto 2.5rem',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 30px 60px rgba(15, 23, 42, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: 6,
          overflow: 'hidden',
        }}>
          <div style={{
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #edf2f7',
            overflow: 'hidden',
            textAlign: 'left',
          }}>
            {/* Header bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: '1px solid #e2e8f0',
              background: '#fff',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: MUTED,
                fontWeight: 500,
                background: '#f1f5f9',
                padding: '4px 20px',
                borderRadius: 999,
                border: '1px solid #e2e8f0',
              }}>
                bronit.uz/dashboard
              </div>
              <div style={{ width: 38 }} />
            </div>

            {/* Sidebar + Main grid */}
            <div style={{ display: 'flex', minHeight: 300, flexWrap: 'wrap' }}>
              {/* Mock Sidebar */}
              <div style={{
                width: 180,
                borderRight: '1px solid #e2e8f0',
                background: '#fff',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }} className="lp-mock-sidebar">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <BrandMark size={24} />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: INK }}>Bronit Admin</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'Calendar' },
                    { label: 'Hotels' },
                    { label: 'Clients' },
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: item.active ? ACCENT_DARK : MUTED,
                      background: item.active ? 'rgba(79, 110, 247, 0.08)' : 'transparent',
                    }}>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main dashboard contents */}
              <div style={{ flex: 1, padding: 20, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Stats cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  {STATS.map(({ icon: Icon, value, key, color }) => (
                    <div key={key} style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, background: `${color}15`, color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: MUTED, fontWeight: 500 }}>{t(key)}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: INK, marginTop: 1 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated graphs & tables */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {/* Chart */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: INK }}>Weekly Bookings</span>
                      <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 600 }}>+12.4%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 75, paddingBottom: 6 }}>
                      {[40, 65, 50, 85, 70, 95, 110].map((h, i) => (
                        <div key={i} style={{
                          flex: 1,
                          height: `${h}%`,
                          background: i === 6 ? `linear-gradient(to top, ${ACCENT_DARK}, ${ACCENT})` : '#e2e8f0',
                          borderRadius: '4px 4px 0 0',
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: INK, marginBottom: 12 }}>Recent Reservations</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { guest: 'Dilshod R.', service: 'Spa Massage', status: 'Confirmed' },
                        { guest: 'Nilufar K.', service: 'Conference Hall', status: 'Pending' },
                        { guest: 'Sherzod T.', service: 'Pool Access', status: 'Completed' },
                      ].map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: idx !== 2 ? 8 : 0,
                          borderBottom: idx !== 2 ? '1px solid #f1f5f9' : 'none',
                          fontSize: '0.7rem',
                        }}>
                          <div>
                            <span style={{ fontWeight: 600, color: INK, display: 'block' }}>{item.guest}</span>
                            <span style={{ color: MUTED, fontSize: '0.65rem' }}>{item.service}</span>
                          </div>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            background: item.status === 'Confirmed' ? '#e8f5e9' : item.status === 'Pending' ? '#fff8e1' : '#f1f5f9',
                            color: item.status === 'Confirmed' ? '#2e7d32' : item.status === 'Pending' ? '#f57f17' : '#475569',
                          }}>{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>{t('lpStatsDisclaimer')}</p>
        
        <a href="#features" className="lp-scroll-down">
          <div className="lp-scroll-indicator">
            <span className="lp-scroll-dot" />
          </div>
          <span>Scroll Down</span>
        </a>
      </div>
    </section>

  )
}

