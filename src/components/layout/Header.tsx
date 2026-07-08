'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation, LanguageCode, LANGUAGES } from '@/i18n'
import Dropdown from '@/components/ui/Dropdown'

interface Props {
  userName: string
  userEmail: string
  onToggleSidebar?: () => void
  sidebarCollapsed?: boolean
}

export default function Header({ userName, userEmail, onToggleSidebar, sidebarCollapsed }: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { lang, setLang, t } = useTranslation()

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/${lang}/login`)
    router.refresh()
  }

  return (
    <header style={{
      height: 60,
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--surface-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      flexShrink: 0,
    }}>
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          style={{
            width: 34, height: 34,
            flexShrink: 0,
            background: 'var(--gray-100)',
            border: '1px solid var(--gray-200)',
            borderRadius: 9,
            color: 'var(--gray-600)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gray-200)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gray-100)' }}
          title={sidebarCollapsed ? t('showSidebar') : t('hideSidebar')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      )}
      {!onToggleSidebar && <div />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Dropdown
          value={lang}
          onChange={val => setLang(val as LanguageCode)}
          options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
          ariaLabel={t('language')}
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
