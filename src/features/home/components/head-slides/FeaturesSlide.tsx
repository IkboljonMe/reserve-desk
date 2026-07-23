'use client'

import { CalendarDays, Wallet, Send, Building2, TrendingUp, FileText } from 'lucide-react'
import { SlideBackground } from './SlideBackground'

interface Props {
  badge: string
  title: string
  features: string[]
}

// Icons are paired with the translated `features` list by position (defined in
// the server Hero and threaded through as strings).
const ICONS = [CalendarDays, Wallet, Send, Building2, TrendingUp, FileText] as const

export function FeaturesSlide({ badge, title, features }: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-center overflow-hidden">
      <SlideBackground />

      {/* Layered Content on Top */}
      <div className="relative z-10 w-full max-w-250 px-5 sm:px-10 py-8 sm:py-12 flex flex-col items-center text-white">
        <div className="inline-flex items-center gap-2 mb-3 sm:mb-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[0.65rem] sm:text-[0.8rem] font-bold tracking-wide">
          {badge}
        </div>

        <h2 className="text-[1.35rem] sm:text-[2rem] md:text-[2.6rem] font-black tracking-tight leading-[1.15] sm:leading-[1.1] mb-5 sm:mb-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {title}
        </h2>

        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 w-full list-none p-0 m-0">
          {features.map((label, i) => {
            const Icon = ICONS[i] ?? ICONS[ICONS.length - 1]
            return (
              <li
                key={label}
                className="flex items-center gap-2.5 sm:gap-3 text-left px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20"
              >
                <span className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/15 text-[#a5b4fc]">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <span className="text-[0.75rem] sm:text-[0.95rem] font-semibold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                  {label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
