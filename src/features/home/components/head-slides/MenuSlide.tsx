'use client'

import { ChevronRight } from 'lucide-react'

interface Props {
  badge: string
  title1: string
  title2: string
  subtitle: string
  ctaLabel: string
  demoUrl: string
}

export function MenuSlide({ badge, title1, title2, subtitle, ctaLabel, demoUrl }: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center sm:items-start justify-center text-center sm:text-left overflow-hidden">
      <div className="absolute inset-0 z-0">
        <picture>
          {/* Desktop wide */}
          <source media="(min-width: 1024px)" srcSet="/sliders/bronit-menu/xl.webp" type="image/webp" />
          <source media="(min-width: 1024px)" srcSet="/sliders/bronit-menu/xl.jpg" type="image/jpeg" />
          {/* Tablet */}
          <source media="(min-width: 640px)" srcSet="/sliders/bronit-menu/sm.webp" type="image/webp" />
          <source media="(min-width: 640px)" srcSet="/sliders/bronit-menu/sm.jpg" type="image/jpeg" />
          {/* Mobile */}
          <source srcSet="/sliders/bronit-menu/xs.webp" type="image/webp" />
          <img
            src="/sliders/bronit-menu/xs.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover scale-[1.03]"
          />
        </picture>
        {/* Soft dark overlay on left and right for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80 lg:to-slate-950" />
        {/* Subtle blur on the right side for tablet/desktop */}
        <div className="hidden sm:block absolute inset-y-0 right-0 w-[40%] lg:w-[30%] backdrop-blur-[6px] [mask-image:linear-gradient(to_left,black_20%,transparent_100%)] pointer-events-none" />
      </div>

      {/* Layered Content on Top */}
      <div className="relative z-10 max-w-215 px-6 sm:px-16 md:px-32 py-8 sm:py-12 flex flex-col items-center sm:items-start justify-center text-white">
        <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[0.65rem] sm:text-[0.8rem] font-bold tracking-wide">
          {badge}
        </div>

        <h1 className="text-[1.4rem] sm:text-[2.2rem] md:text-[3.5rem] font-black tracking-tight leading-[1.15] sm:leading-[1.08] mb-2.5 sm:mb-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {title1} <span className="text-[#a5b4fc] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{title2}</span>
        </h1>

        <p className="text-slate-200 text-[0.8rem] sm:text-base md:text-[1.2rem] leading-relaxed mb-5 sm:mb-8 max-w-170 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          {subtitle}
        </p>

        <div className="flex gap-2.5 sm:gap-3 justify-center sm:justify-start flex-wrap">
          <a
            href={demoUrl}
            className="px-4 py-2.5 sm:px-7.5 sm:py-3.5 rounded-xl no-underline bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white text-xs sm:text-sm font-bold shadow-[0_8px_24px_rgba(79,110,247,0.35)] inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(79,110,247,0.45)]"
          >
            {ctaLabel} <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
