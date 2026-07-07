'use client'

import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration = 750) {
  const [val, setVal] = useState(target)
  const fromRef = useRef(target)
  
  useEffect(() => {
    const from = fromRef.current
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  
  return val
}
