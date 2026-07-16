'use client'

import { useState } from 'react'

import { useTranslation } from '@/i18n'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

export default function LoginFormClient() {

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
    } catch {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.8125rem] font-semibold text-white/70 tracking-tight">{t('emailAddress')}</label>
        <input
          id="email"
          type="email"
          className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white/7 border-1.5 border-white/12 text-white placeholder-white/30 focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          placeholder="example@bronit.uz"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.8125rem] font-semibold text-white/70 tracking-tight">{t('password')}</label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 min-h-[38px] rounded-lg text-sm outline-none transition-all duration-150 bg-white/7 border-1.5 border-white/12 text-white placeholder-white/30 focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)]"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-[8px_12px] text-[#fca5a5] text-sm">
          {error}
        </div>
      )}

      <Button
        id="login-submit"
        type="submit"
        disabled={loading}
        size="lg"
        className="mt-1 w-full"
      >
        {loading ? <Spinner size={18} dark={false} /> : null}
        {loading ? t('signingIn') : t('signIn')}
      </Button>
    </form>
  )
}
