'use client'

import { useEffect, useRef } from 'react'

// Decorative hero backdrop: soft, blurred gradient "blobs" in the Bronit palette.
// Two drift on a slow CSS loop; a third eases toward the mouse for a liquid feel.
// Purely presentational (aria-hidden, pointer-events: none) and disabled under
// prefers-reduced-motion.
export function HeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null)
  const followRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const el = followRef.current
    if (!root || !el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const r0 = root.getBoundingClientRect()
    // Start near the upper-right, then chase the cursor with easing (lerp).
    let tx = r0.width * 0.68
    let ty = r0.height * 0.3
    let cx = tx
    let cy = ty
    let raf = 0

    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect()
      tx = e.clientX - r.left
      ty = e.clientY - r.top
    }
    const tick = () => {
      cx += (tx - cx) * 0.055
      cy += (ty - cy) * 0.055
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="absolute inset-y-0 left-1/2 w-[100vw] -translate-x-1/2 overflow-hidden pointer-events-none z-0"
    >
      {/* Sleek Grid mesh backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(79, 110, 247, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 110, 247, 0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: 'center top',
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, #000 70%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 30%, #000 70%, transparent 100%)',
      }} />
      <div className="absolute rounded-full blur-[90px] opacity-65 pointer-events-none w-[45vw] max-w-135 aspect-square left-[4%] top-[-12%] bg-[radial-gradient(circle,rgba(79,110,247,0.32),transparent_65%)] animate-float-1" />
      <div className="absolute rounded-full blur-[90px] opacity-65 pointer-events-none w-[40vw] max-w-125 aspect-square right-[2%] top-[-18%] bg-[radial-gradient(circle,rgba(124,58,237,0.28),transparent_65%)] animate-float-2" />
      <div ref={followRef} className="absolute rounded-full blur-[90px] opacity-65 pointer-events-none w-[38vw] max-w-120 aspect-square left-0 top-0 bg-[radial-gradient(circle,rgba(79,110,247,0.3)_0%,rgba(124,58,237,0.18)_45%,rgba(34,211,238,0.08)_70%,transparent_80%)] transition-opacity duration-300" />
    </div>


  )
}

