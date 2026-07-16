'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CARD } from '../constants'

// A single FAQ row. Replaces the native <details> so open/close can be animated:
// the answer panel is a CSS grid whose row track transitions 0fr → 1fr, which
// smoothly animates height without measuring the content, and the chevron spins.
export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`${CARD} bg-white`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left px-[1.4rem] py-[1.1rem] cursor-pointer"
      >
        <span className="font-bold text-[0.95rem] text-slate-900">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ease-out ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="text-slate-500 text-[0.9rem] leading-relaxed px-[1.4rem] pb-[1.1rem]">{a}</p>
        </div>
      </div>
    </div>
  )
}
