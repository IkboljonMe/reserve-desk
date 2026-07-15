'use client'

import { useState, useEffect } from 'react'
import { X, PhoneCall } from 'lucide-react'

interface Props {
  title: string
  desc: string
  namePlaceholder: string
  phonePlaceholder: string
  submitLabel: string
  sendingLabel: string
  successMsg: string
  errorMsg: string
  closeLabel: string
}

type Status = 'idle' | 'sending' | 'success' | 'error'

// Call-back widget: a floating button that's always available (click to open,
// X to close). It also auto-opens once when the visitor reaches the bottom.
// Submitting posts to /api/leads, which pings admins on Telegram.
export function ContactWidget(p: Props) {
  const [open, setOpen] = useState(false)
  const [autoDone, setAutoDone] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (autoDone) return
    const check = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 240
      if (nearBottom) { setOpen(true); setAutoDone(true) }
    }
    const raf = requestAnimationFrame(check)
    window.addEventListener('scroll', check, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', check) }
  }, [autoDone])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (!open) {
    return (
      <button type="button" className="lp-contact-fab" onClick={() => setOpen(true)} aria-label={p.title}>
        <PhoneCall size={22} />
      </button>
    )
  }

  return (
    <div className="lp-contact" role="dialog" aria-label={p.title}>
      <button type="button" className="lp-contact-close" onClick={() => setOpen(false)} aria-label={p.closeLabel}>
        <X size={16} />
      </button>

      {status === 'success' ? (
        <div className="lp-contact-success">✅ {p.successMsg}</div>
      ) : (
        <form onSubmit={submit}>
          <div className="lp-contact-head">
            <span className="lp-contact-icon"><PhoneCall size={16} /></span>
            <strong>{p.title}</strong>
          </div>
          <p className="lp-contact-desc">{p.desc}</p>
          <input
            className="lp-contact-input" value={name} onChange={e => setName(e.target.value)}
            placeholder={p.namePlaceholder} required maxLength={120}
          />
          <input
            className="lp-contact-input" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder={p.phonePlaceholder} type="tel" required maxLength={40}
          />
          {status === 'error' && <div className="lp-contact-err">{p.errorMsg}</div>}
          <button className="lp-contact-submit" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? p.sendingLabel : p.submitLabel}
          </button>
        </form>
      )}
    </div>
  )
}
