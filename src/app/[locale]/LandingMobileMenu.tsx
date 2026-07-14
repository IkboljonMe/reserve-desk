'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X, ChevronRight } from 'lucide-react'

const ACCENT = '#4f6ef7'
const ACCENT_DARK = '#3b5bdb'
const INK = '#0f172a'

interface NavLink { href: string; label: string }

interface Props {
  links: NavLink[]
  signInHref: string
  signInLabel: string
  demoHref: string
  demoLabel: string
}

// Toggle the page's scroll lock. Module-scope so the DOM write isn't inside the
// component body (keeps the react-hooks lint rules happy).
function lockScroll(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

// Mobile-only navbar menu: a hamburger that slides a panel in from the right with
// the section links and the Login / Try-free actions. Hidden on desktop via the
// `.lp-mobile-menu-btn` media rule in the landing page's <style>.
export function LandingMobileMenu({ links, signInHref, signInLabel, demoHref, demoLabel }: Props) {
  const [open, setOpen] = useState(false)
  // Portal target only exists after mount; also avoids the header's
  // backdrop-filter becoming the containing block for the fixed overlay.
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    lockScroll(open)
    return () => lockScroll(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        className="lp-mobile-menu-btn"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        style={{
          width: 38, height: 38, borderRadius: 10, border: '1px solid #e2e8f0',
          background: '#fff', color: INK, alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <Menu size={20} />
      </button>

      {mounted && createPortal(
        <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease', zIndex: 1000,
        }}
      />

      {/* Right-side drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        style={{
          position: 'fixed', top: 0, right: 0, height: '100dvh', width: 'min(300px, 82vw)',
          background: '#fff', boxShadow: '-10px 0 40px rgba(15,23,42,0.18)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', zIndex: 1001,
          display: 'flex', flexDirection: 'column', padding: '0.9rem 1.15rem 1.4rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button" aria-label="Close" onClick={close}
            style={{
              width: 38, height: 38, borderRadius: 10, border: '1px solid #e2e8f0',
              background: '#fff', color: INK, display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 }}>
          {links.map(l => (
            <a
              key={l.href} href={l.href} onClick={close}
              style={{
                padding: '11px 12px', borderRadius: 10, textDecoration: 'none',
                color: INK, fontSize: '0.95rem', fontWeight: 600,
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 18, borderTop: '1px solid #eef2f7' }}>
          <Link
            href={signInHref} onClick={close}
            style={{
              padding: '12px 16px', borderRadius: 12, textDecoration: 'none', textAlign: 'center',
              background: '#fff', color: INK, border: '1px solid #e2e8f0',
              fontSize: '0.95rem', fontWeight: 600,
            }}
          >
            {signInLabel}
          </Link>
          <a
            href={demoHref} onClick={close}
            style={{
              padding: '12px 16px', borderRadius: 12, textDecoration: 'none', textAlign: 'center',
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`, color: '#fff',
              fontSize: '0.95rem', fontWeight: 700, boxShadow: '0 6px 18px rgba(79,110,247,0.3)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {demoLabel} <ChevronRight size={17} />
          </a>
        </div>
      </aside>
        </>,
        document.body,
      )}
    </>
  )
}
