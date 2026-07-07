'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation, LanguageCode } from '@/lib/i18n'
import Dropdown from '@/components/ui/Dropdown'

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
      height: 60,
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
        <Dropdown
          value={lang}
          onChange={val => setLang(val as LanguageCode)}
          options={[
            { value: 'uz', label: "O'Z" },
            { value: 'ru', label: 'RU' },
            { value: 'en', label: 'EN' },
          ]}
          ariaLabel="Language"
          containerClassName="lang-dropdown"
        />

        <div style={{ width: 1, height: 24, background: 'var(--surface-border)' }} />

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '4px 6px 4px 4px',
          borderRadius: 999,
        }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 3px 8px rgba(79,110,247,0.35)',
            flexShrink: 0,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>

          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray-800)' }}>{userName}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{userEmail}</div>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-ghost btn-sm btn-icon"
          title={t('signOut')}
          aria-label={t('signOut')}
          style={{ marginLeft: 2 }}
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
