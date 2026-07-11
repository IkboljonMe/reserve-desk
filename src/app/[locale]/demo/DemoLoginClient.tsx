'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n'
import { DEMO_HOTELS, findDemoStaff } from '@/features/demo/data'
import { setDemoSession } from '@/features/demo/storage'

export default function DemoLoginClient() {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const [email, setEmail] = useState(DEMO_HOTELS[0].staff[0].email)
  const [password, setPassword] = useState(DEMO_HOTELS[0].staff[0].password)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = findDemoStaff(email.trim(), password)
    if (!found) {
      setError(t('demoLoginFailed'))
      return
    }
    setDemoSession({ hotelId: found.hotel.id, staffName: found.staff.name })
    router.push(`/${lang}/demo/dashboard`)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('emailAddress')}</label>
          <input
            className="form-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('password')}</label>
          <input
            className="form-input"
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', color: '#fff' }}
          />
        </div>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', color: '#fca5a5', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>{t('viewDemo')}</button>
      </form>

      <div style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
        <p style={{ marginBottom: 6, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{t('demoAccountsHint')}</p>
        {DEMO_HOTELS.map(h => (
          <div key={h.id} style={{ marginBottom: 4 }}>
            {h.name}: <code>{h.staff[0].email}</code> / <code>{h.staff[0].password}</code>
          </div>
        ))}
      </div>
    </div>
  )
}
