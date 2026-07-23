"use client";

import { ChevronRight } from "lucide-react";
import { SlideBackground } from "./SlideBackground";

interface Props {
  badge: string;
  title1: string;
  title2: string;
  subtitle: string;
  ctaLabel: string;
  pricingLabel: string;
  demoUrl: string;
}

export function MainSlide({
  badge,
  title1,
  title2,
  subtitle,
  ctaLabel,
  pricingLabel,
  demoUrl,
}: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center sm:items-start justify-center text-center sm:text-left overflow-hidden">
      <SlideBackground eager />

      {/* Layered Content on Top */}
      <div className="relative z-10 max-w-215 px-6 sm:px-16 md:px-32 py-8 sm:py-12 flex flex-col items-center sm:items-start justify-center text-white">
        <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[0.65rem] sm:text-[0.8rem] font-bold tracking-wide">
          {badge}
        </div>

        <h1 className="text-[1.4rem] sm:text-[2.2rem] md:text-[3.5rem] font-black tracking-tight leading-[1.15] sm:leading-[1.08] mb-2.5 sm:mb-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {title1}{" "}
          <span className="text-[#a5b4fc] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {title2}
          </span>
        </h1>

        <p className="text-slate-200 text-[0.8rem] sm:text-base md:text-[1.2rem] leading-relaxed mb-5 sm:mb-8 max-w-170 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          {subtitle}
        </p>

        <div className="flex gap-2.5 sm:gap-3 justify-center sm:justify-start flex-wrap">
          <a
            href={demoUrl}
            className="px-4 py-2.5 sm:px-7.5 sm:py-3.5 no-underline bg-[linear-gradient(135deg,#4f6ef7,#3b5bdb)] text-white text-xs sm:text-sm font-bold shadow-[0_8px_24px_rgba(79,110,247,0.35)] inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(79,110,247,0.45)]"
          >
            {ctaLabel} <ChevronRight size={16} />
          </a>
          <a
            href="#pricing"
            className="px-4 py-2.5 sm:px-7.5 sm:py-3.5 no-underline bg-white/10 backdrop-blur-md text-white border border-white/20 text-xs sm:text-sm font-semibold inline-flex items-center transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5"
          >
            {pricingLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
