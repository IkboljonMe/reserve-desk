'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronRight, Sparkles } from 'lucide-react'

interface Props {
  badge: string
  title1: string
  title2: string
  subtitle: string
  ctaLabel: string
  pricingLabel: string
  demoUrl: string
  scrollLabel: string
}

// Cinematic hero: a full-screen banner loads sharp, then after ~2.5s it blurs
// and the headline + copy + CTAs fade in over it. The hero is pinned (sticky) so
// the rest of the page scrolls up over it. Styling lives in LandingStyles
// (`.lp-hero-fs*`); this component only owns the reveal timing.
export function HeroClient({ badge, title1, title2, subtitle, ctaLabel, pricingLabel, demoUrl, scrollLabel }: Props) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className={`relative h-[100dvh] min-h-[560px] w-full flex flex-col items-center justify-center text-center overflow-hidden max-[640px]:h-auto max-[640px]:min-h-0 max-[640px]:py-[50px] ${revealed ? 'max-[640px]:bg-[linear-gradient(180deg,#eef1fb,#f8fafc)]' : ''}`}>
      <div className="absolute inset-0 z-0 max-[640px]:hidden">
        <Image
          className={`transition-all duration-[1.4s] ease-in-out ${revealed ? 'blur-[5px] scale-[1.04]' : 'blur-0 scale-100'}`}
          src="/assets/hero-banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className={`absolute inset-0 z-[1] bg-[radial-gradient(ellipse_72%_56%_at_50%_50%,rgba(248,250,252,0.74),rgba(248,250,252,0.32))] transition-opacity duration-[1.4s] ease-in-out ${revealed ? 'opacity-100' : 'opacity-0'}`} />

      <div className={`relative z-[2] max-w-[820px] px-6 transition-all duration-[1s] ease-out delay-[0.2s] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[28px]'}`}>
        <div className="inline-flex items-center gap-2 mb-[22px] px-3.5 py-1.5 rounded-full bg-[#4f6ef7]/10 border border-[#4f6ef7]/20 text-[#3b5bdb] text-[0.8rem] font-semibold">
          <Sparkles size={14} /> {badge}
        </div>
        <h1 className="text-[2rem] sm:text-[5.5vw] md:text-[3.6rem] font-extrabold tracking-tight leading-[1.08] mb-[1.1rem] text-[#0f172a]">
          {title1} <span className="bg-[linear-gradient(135deg,#4f6ef7,#7c3aed)] bg-clip-text text-transparent">{title2}</span>
        </h1>
        <p className="text-slate-600 text-base sm:text-lg md:text-[1.2rem] leading-relaxed mx-auto mb-8 max-w-[640px]">{subtitle}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href={demoUrl}
            className="px-[30px] py-[14px] rounded-xl no-underline bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white font-bold shadow-[0_8px_24px_rgba(79,110,247,0.35)] inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(79,110,247,0.45)]"
          >
            {ctaLabel} <ChevronRight size={18} />
          </a>
          <a
            href="#pricing"
            className="px-[30px] py-[14px] rounded-xl no-underline bg-white/90 text-slate-900 border border-slate-200 font-semibold inline-flex items-center transition-all duration-300 hover:bg-white hover:border-slate-300 hover:-translate-y-0.5"
          >
            {pricingLabel}
          </a>
        </div>
      </div>

      <a
        href="#features"
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[2] m-0 transition-opacity duration-[1s] ease-out delay-[0.6s] max-[640px]:hidden inline-flex flex-col items-center gap-2 text-slate-400 no-underline text-[0.68rem] font-bold tracking-[0.08em] uppercase hover:text-[#4f6ef7] ${revealed ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="w-5 h-8 border-2 border-current rounded-[12px] relative opacity-80">
          <span className="w-1 h-1.5 bg-current rounded-[2px] absolute left-1/2 -translate-x-1/2 top-1.5 animate-scroll-wheel" />
        </div>
        <span>{scrollLabel}</span>
      </a>
    </section>
  )
}

