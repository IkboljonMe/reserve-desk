'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation, LanguageCode } from '@/lib/i18n'

interface Props {
  userName: string
  userEmail: string
}

export default function Header({ userName, userEmail }: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { lang, setLang, t } = useTranslation()

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      height: 56,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--surface-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      flexShrink: 0,
    }}>
      <div />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.8125rem',
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>

        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-800)' }}>{userName}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{userEmail}</div>
        </div>

        <select
          value={lang}
          onChange={e => setLang(e.target.value as LanguageCode)}
          style={{
            marginLeft: 8,
            padding: '4px 6px',
            borderRadius: 6,
            border: '1px solid var(--gray-200)',
            fontSize: '0.75rem',
            background: 'var(--surface-bg)',
            color: 'var(--gray-700)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="uz">O'Z</option>
          <option value="ru">RU</option>
          <option value="en">EN</option>
        </select>

        <button
          id="logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-ghost btn-sm"
          title={t('signOut')}
          style={{ marginLeft: 4 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
