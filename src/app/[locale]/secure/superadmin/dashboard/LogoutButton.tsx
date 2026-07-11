'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n'

export default function LogoutButton() {
  const router = useRouter()
  const { t, lang } = useTranslation()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/${lang}/secure/superadmin/login`)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="btn btn-sm"
      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
    >
      {loggingOut ? <span className="spinner" /> : t('signOut')}
    </button>
  )
}
