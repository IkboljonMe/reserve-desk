import LoginFormClient from './LoginFormClient'

export default function LoginPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(900px 500px at 80% -10%, rgba(124,58,237,0.35), transparent 60%),
        radial-gradient(800px 500px at 10% 110%, rgba(79,110,247,0.30), transparent 55%),
        linear-gradient(135deg, #14192a 0%, #1e2540 50%, #14192a 100%)`,
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '1rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(79,110,247,0.4)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
              <path d="M7 8h.01M12 8h.01M17 8h.01M7 12h.01M12 12h.01M17 12h.01"/>
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>ReserveDesk</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Hotel Admin Portal</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: '2rem',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}>
          <h2 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sign in to your account</h2>
          <LoginFormClient />
        </div>
      </div>
    </main>
  )
}
