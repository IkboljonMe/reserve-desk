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
      className="lp-hero-bg"
      style={{
        position: 'absolute', top: 0, bottom: 0, left: '50%', width: '100vw',
        transform: 'translateX(-50%)', overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}
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
      <div className="lp-blob lp-blob-1" />
      <div className="lp-blob lp-blob-2" />
      <div ref={followRef} className="lp-blob lp-blob-follow" />
    </div>

  )
}

