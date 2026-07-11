'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n'
import { DEMO_SLUG, DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD } from '@/features/demo/config'

// One-click login into the seeded demo tenant's OWNER account — visitors get
// the real dashboard (bookings, calendar, analytics, settings), not a mock.
export default function DemoEntryClient() {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function enterDemo() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEMO_OWNER_EMAIL, password: DEMO_OWNER_PASSWORD, slug: DEMO_SLUG }),
      })
      if (!res.ok) {
        setError(t('demoUnavailable'))
        return
      }
      router.push(`/${lang}/secure/company/${DEMO_SLUG}/dashboard`)
      router.refresh()
    } catch {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        type="button"
        onClick={enterDemo}
        disabled={loading}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? <span className="spinner" /> : null}
        {loading ? t('signingIn') : t('demoEnterOwner')}
      </button>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '8px 12px', color: '#fca5a5', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
        <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{t('demoAccountsHint')}</p>
        <div>{t('emailAddress')}: <code>{DEMO_OWNER_EMAIL}</code></div>
        <div>{t('password')}: <code>{DEMO_OWNER_PASSWORD}</code></div>
      </div>
    </div>
  )
}
