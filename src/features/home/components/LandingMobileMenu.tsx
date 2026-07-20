'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X, ChevronRight } from 'lucide-react'


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
        className="inline-flex min-[721px]:hidden w-[38px] h-[38px] rounded-lg border border-slate-200 bg-white text-slate-900 items-center justify-center cursor-pointer shrink-0"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      {mounted && createPortal(
        <>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 bg-slate-900/45 transition-opacity duration-250 ease-out z-[1000] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Right-side drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed top-0 right-0 h-[100dvh] w-[min(300px,82vw)] bg-white shadow-[-10px_0_40px_rgba(15,23,42,0.18)] transition-transform duration-280 z-[1001] flex flex-col p-[0.9rem_1.15rem_1.4rem]`}
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="w-[38px] h-[38px] rounded-lg border border-slate-200 bg-white text-slate-900 inline-flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 mt-2.5">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className="px-3 py-2.75 rounded-lg no-underline text-slate-900 text-[0.95rem] font-semibold"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2.5 pt-4.5 border-t border-slate-100">
          <Link
            href={signInHref}
            onClick={close}
            className="px-4 py-3 rounded-xl no-underline text-center bg-white text-slate-900 border border-slate-200 text-[0.95rem] font-semibold"
          >
            {signInLabel}
          </Link>
          <a
            href={demoHref}
            onClick={close}
            className="px-4 py-3 rounded-xl no-underline text-center bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white text-[0.95rem] font-bold shadow-[0_6px_18px_rgba(79,110,247,0.3)] inline-flex items-center justify-center gap-2"
          >
            {demoLabel} <ChevronRight size={17} />
          </a>
        </div>
      </div>
        </>,
        document.body,
      )}
    </>
  )
}
