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
    <section className={`lp-hero-fs${revealed ? ' is-revealed' : ''}`}>
      <div className="lp-hero-fs-bg">
        <Image
          className="lp-hero-fs-img"
          src="/assets/hero-banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="lp-hero-fs-veil" />

      <div className="lp-hero-fs-content">
        <div className="lp-hero-fs-badge"><Sparkles size={14} /> {badge}</div>
        <h1 className="lp-hero-fs-title">
          {title1} <span className="lp-hero-overlay-accent">{title2}</span>
        </h1>
        <p className="lp-hero-fs-sub">{subtitle}</p>
        <div className="lp-hero-fs-ctas">
          <a href={demoUrl} className="lp-btn-primary lp-hero-fs-cta-primary">
            {ctaLabel} <ChevronRight size={18} />
          </a>
          <a href="#pricing" className="lp-btn-secondary lp-hero-fs-cta-secondary">
            {pricingLabel}
          </a>
        </div>
      </div>

      <a href="#features" className="lp-scroll-down lp-hero-fs-scroll">
        <div className="lp-scroll-indicator"><span className="lp-scroll-dot" /></div>
        <span>{scrollLabel}</span>
      </a>
    </section>
  )
}
