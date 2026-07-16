'use client'

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
}

export function MainSlide({ badge, title1, title2, subtitle, ctaLabel, pricingLabel, demoUrl }: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center sm:items-start justify-center text-center sm:text-left overflow-hidden">
      {/* Blurred Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/hero-banner.png"
          alt="Bronit Banner"
          fill
          priority
          sizes="100vw"
          className="object-cover blur-[8px] scale-[1.03]"
        />
        {/* Soft dark overlay to enhance text contrast and make whites pop */}
        <div className="absolute inset-0 bg-slate-950/45" />
      </div>

      {/* Layered Content on Top */}
      <div className="relative z-10 max-w-[860px] px-6 sm:px-16 md:px-32 py-12 flex flex-col items-center sm:items-start justify-center text-white">
        <div className="inline-flex items-center gap-2 mb-[16px] px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[0.7rem] sm:text-[0.8rem] font-bold tracking-wide">
          {badge}
        </div>
        
        <h1 className="text-[1.65rem] sm:text-[2.2rem] md:text-[3.5rem] font-black tracking-tight leading-[1.12] sm:leading-[1.08] mb-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {title1} <span className="text-[#a5b4fc] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{title2}</span>
        </h1>
        
        <p className="text-slate-200 text-[0.875rem] sm:text-base md:text-[1.2rem] leading-relaxed mb-8 max-w-[680px] font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          {subtitle}
        </p>
        
        <div className="flex gap-3 justify-center sm:justify-start flex-wrap">
          <a
            href={demoUrl}
            className="px-5 py-3 sm:px-[30px] sm:py-[14px] rounded-xl no-underline bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white text-xs sm:text-sm font-bold shadow-[0_8px_24px_rgba(79,110,247,0.35)] inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(79,110,247,0.45)]"
          >
            {ctaLabel} <ChevronRight size={16} />
          </a>
          <a
            href="#pricing"
            className="px-5 py-3 sm:px-[30px] sm:py-[14px] rounded-xl no-underline bg-white/10 backdrop-blur-md text-white border border-white/20 text-xs sm:text-sm font-semibold inline-flex items-center transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5"
          >
            {pricingLabel}
          </a>
        </div>
      </div>
    </div>
  )
}
