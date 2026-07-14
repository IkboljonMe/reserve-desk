'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n'
import { getClientSubdomain } from '@/lib/subdomain'

// One form for every login surface. Area-specific pages pass context the API
// validates against the account: `slug` (company login page, hotel login
// page) and `hotelSlug` (hotel login page only). The universal /login page
// passes neither — the account's own role/company/hotel decide where it goes.
export default function LoginFormClient({ slug, hotelSlug }: { slug?: string; hotelSlug?: string }) {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, slug, hotelSlug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('loginFailed'))
      } else {
        // Cross-domain redirection
        const currentHost = window.location.host
        const isLocal = currentHost.includes('localhost') || currentHost.includes('.test') || currentHost.includes('172.')
        const protocol = isLocal ? 'http' : 'https'
        // Strip any existing subdomain to get the base domain string
        const baseDomain = currentHost.replace(/^(app|admin|demo|[\w-]+)\.smartix/, 'smartix')
        
        // We know they are on the root domain because proxy forces them there for login.
        let destUrl = ''
        if (data.role === 'superadmin') {
           destUrl = `${protocol}://admin.${baseDomain}/${lang}/dashboard`
        } else if (data.role === 'owner') {
           destUrl = `${protocol}://${data.slug}.${baseDomain}/${lang}/dashboard`
        } else {
           destUrl = `${protocol}://${data.hotelSlug}.${baseDomain}/${lang}/calendar`
        }
        
        window.location.href = destUrl
      }
    } catch (err) {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('emailAddress')}</label>
        <input
          id="email"
          type="email"
          className="form-input"
          placeholder="example@easy-service.uz"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            color: '#fff',
          }}
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('password')}</label>
        <input
          id="password"
          type="password"
          className="form-input"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            color: '#fff',
          }}
        />
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#fca5a5',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="btn btn-primary btn-lg"
        style={{ marginTop: '0.25rem', width: '100%' }}
      >
        {loading ? <span className="spinner" /> : null}
        {loading ? t('signingIn') : t('signIn')}
      </button>
    </form>
  )
}
