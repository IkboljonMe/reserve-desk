'use client'

import Link from 'next/link'
import { BrandMark } from '@/components/BrandMark'
import { LandingLangToggle } from './LandingLangToggle'
import { LandingMobileMenu } from './LandingMobileMenu'
import { DISPLAY_FONT, type Translate } from '../constants'
import { CheckCircle2, Sparkles, Brain, Users, ShieldCheck, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

interface Props {
  locale: string
  t: Translate
  demoUrl: string
  loginHref: string
  navLinks: { href: string; label: string }[]
}

export function Navbar({ locale, t, demoUrl, loginHref, navLinks }: Props) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 w-full flex flex-col transition-colors duration-200">
      <div className="w-full px-5 lg:px-10 py-[0.8rem] flex items-center gap-5 flex-wrap">
        <div
          className="flex items-center gap-2.5 font-normal text-[1.15rem] text-slate-900 dark:text-white"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          <BrandMark size={42} priority />
          Bronit
        </div>

        <nav className="flex gap-2 ml-auto items-center flex-wrap">
          <div className="hidden min-[721px]:flex items-center gap-1 flex-wrap">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="px-3 py-1.75 rounded-lg no-underline text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-slate-900 dark:hover:text-white"
              >
                {label}
              </a>
            ))}
          </div>
          <LandingLangToggle current={locale} />
          
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label="Theme toggle"
            className="w-[38px] h-[38px] inline-flex items-center justify-center rounded-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200/40 dark:border-slate-700/50 transition-colors duration-150"
          >
            {theme === 'dark' ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </button>

          <div className="hidden min-[721px]:flex items-center gap-2">
            <Link
              href={loginHref}
              className="px-4 py-2 rounded-[10px] no-underline bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80"
            >
              {t('signIn')}
            </Link>
            <a
              href={demoUrl}
              className="px-4 py-2 rounded-[10px] no-underline bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white text-sm font-bold shadow-[0_4px_12px_rgba(79,110,247,0.3)]"
            >
              {t('lpTryFree')}
            </a>
          </div>
          <LandingMobileMenu
            links={navLinks}
            signInHref={loginHref}
            signInLabel={t('signIn')}
            demoHref={demoUrl}
            demoLabel={t('lpTryFree')}
          />
        </nav>
      </div>

      {/* Advantage Strip */}
      <div className="hidden md:block bg-[#2563eb] text-white py-3.5 px-5 lg:px-10 text-[0.8rem] font-medium border-t border-white/10 shadow-sm">
        <div className="w-full flex flex-wrap items-center justify-between gap-y-3 gap-x-6">
          <div className="font-extrabold text-[0.85rem] tracking-wider uppercase bg-white/15 px-3 py-1 rounded-md">
            {t('lpAdvantageTitle')}
          </div>
          <div className="flex items-center justify-between gap-6 flex-wrap text-white/90 flex-1 md:flex-initial">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-white/80 shrink-0" />
              {t('lpAdvantageEasy')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} className="text-white/80 shrink-0" />
              {t('lpAdvantageNoPapers')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Brain size={14} className="text-white/80 shrink-0" />
              {t('lpAdvantageNoReminding')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-white/80 shrink-0" />
              {t('lpAdvantageNoLosing')}
            </span>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-white">
              <ShieldCheck size={14} className="text-amber-300 shrink-0" />
              {t('lpAdvantageSolution')}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
