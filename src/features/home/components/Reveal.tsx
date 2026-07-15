'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Scroll-triggered reveal: fades + slides its children up as they enter the
// viewport (ease-out on the way in) and gently reverses when scrolled back out.
// Respects prefers-reduced-motion. Client-only; wraps server-rendered children.
export function Reveal({ children, y = 42, delay = 0 }: { children: ReactNode; y?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay,
          scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 55%', toggleActions: 'play none none reverse' },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [y, delay])

  return <div ref={ref}>{children}</div>
}
