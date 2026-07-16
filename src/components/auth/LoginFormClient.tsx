'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

export default function LoginFormClient() {
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
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('loginFailed'))
      } else {
        if (data.role === 'superadmin') {
           window.location.href = `/${lang}/dashboard`
        } else if (data.role === 'owner') {
           window.location.href = `/${lang}/dashboard`
        } else {
           window.location.href = `/${lang}/calendar`
        }
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
          placeholder="example@bronit.uz"
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

      <Button
        id="login-submit"
        type="submit"
        disabled={loading}
        size="lg"
        style={{ marginTop: '0.25rem', width: '100%' }}
      >
        {loading ? <Spinner size={18} dark={false} /> : null}
        {loading ? t('signingIn') : t('signIn')}
      </Button>
    </form>
  )
}
