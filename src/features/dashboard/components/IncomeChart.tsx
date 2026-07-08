'use client'

import React, { useState, useEffect } from 'react'
import { money } from '@/lib/bookingHelpers'

interface IncomeChartProps {
  data: { label: string; expected: number; collected: number; count: number }[]
}

const EXPECTED = '#6366f1'        // indigo (brand)
const FILL_COLLECTED = '#10b981'  // green fill

export default function IncomeChart({ data }: IncomeChartProps) {
  const [ready, setReady] = useState(false)
  const [hover, setHover] = useState<{ i: number; x: number } | null>(null)
  
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const H = 200
  const max = Math.max(1, ...data.map(d => d.expected))
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(f => f * max)
  const showEveryLabel = data.length <= 16
  const step = Math.ceil(data.length / 12)

  return (
    <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
      {/* Y axis */}
      <div style={{ width: 46, height: H, position: 'relative', flexShrink: 0 }}>
        {gridVals.slice().reverse().map((v, i) => (
          <div key={i} style={{ position: 'absolute', top: `${(i / 4) * 100}%`, right: 4, transform: 'translateY(-50%)', fontSize: '0.62rem', color: 'var(--gray-400)', fontVariantNumeric: 'tabular-nums' }}>
            {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
          </div>
        ))}
      </div>
      {/* Plot */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }} onMouseLeave={() => setHover(null)}>
        <div style={{ position: 'relative', height: H }}>
          {/* Gridlines */}
          {gridVals.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / 4) * 100}%`, borderTop: '1px solid var(--gray-100)' }} />
          ))}
          {/* Bars */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: data.length > 40 ? 1 : 3 }}>
            {data.map((d, i) => {
              const expH = ready ? (d.expected / max) * H : 0
              const colH = ready ? (d.collected / max) * H : 0
              return (
                <div key={i} className="bar-col" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', cursor: 'default' }}
                  onMouseEnter={e => setHover({ i, x: (e.currentTarget as HTMLElement).offsetLeft + (e.currentTarget as HTMLElement).offsetWidth / 2 })}>
                  {/* expected (ceiling) */}
                  <div className="bar-exp" style={{
                    position: 'relative', width: '100%', maxWidth: 34, height: expH,
                    background: `${EXPECTED}1f`, border: `1.5px solid ${EXPECTED}66`, borderBottom: 'none',
                    borderRadius: '4px 4px 0 0', transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 12}ms`,
                    boxShadow: hover?.i === i ? `0 0 0 2px ${EXPECTED}44` : 'none',
                  }}>
                    {/* collected (fill) */}
                    <div style={{ position: 'absolute', left: -1.5, right: -1.5, bottom: 0, height: colH, background: FILL_COLLECTED, borderRadius: colH >= expH - 1 ? '4px 4px 0 0' : '0', transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 12 + 60}ms` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* X labels */}
        <div style={{ display: 'flex', gap: data.length > 40 ? 1 : 3, marginTop: 6 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: 'var(--gray-400)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {(showEveryLabel || i % step === 0) ? d.label : ''}
            </div>
          ))}
        </div>
        {/* Tooltip */}
        {hover && data[hover.i] && (
          <div style={{
            position: 'absolute', top: -8, left: Math.min(Math.max(hover.x, 70), 100000), transform: 'translate(-50%,-100%)',
            background: 'var(--gray-900, #111827)', color: '#fff', padding: '7px 10px', borderRadius: 8, fontSize: '0.7rem',
            pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5, boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>{data[hover.i].label} · {data[hover.i].count} booking{data[hover.i].count === 1 ? '' : 's'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: FILL_COLLECTED }} /> Collected {money(data[hover.i].collected)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.85 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: EXPECTED }} /> Expected {money(data[hover.i].expected)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
