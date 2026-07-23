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
  const gap = data.length > 40 ? 1 : 3

  return (
    <div className="relative flex gap-2">
      {/* Y axis */}
      <div className="w-11.5 shrink-0 relative" style={{ height: H }}>
        {gridVals.slice().reverse().map((v, i) => (
          <div key={i} className="absolute right-1 -translate-y-1/2 text-[0.62rem] text-gray-400 tabular-nums" style={{ top: `${(i / 4) * 100}%` }}>
            {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
          </div>
        ))}
      </div>
      {/* Plot */}
      <div className="flex-1 min-w-0 relative" onMouseLeave={() => setHover(null)}>
        <div className="relative" style={{ height: H }}>
          {/* Gridlines */}
          {gridVals.map((_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${(i / 4) * 100}%` }} />
          ))}
          {/* Bars */}
          <div className="absolute inset-0 flex items-end" style={{ gap }}>
            {data.map((d, i) => {
              const expH = ready ? (d.expected / max) * H : 0
              const colH = ready ? (d.collected / max) * H : 0
              return (
                <div
                  key={i}
                  className="group flex-1 h-full flex items-end justify-center relative cursor-default"
                  onMouseEnter={e => setHover({ i, x: (e.currentTarget as HTMLElement).offsetLeft + (e.currentTarget as HTMLElement).offsetWidth / 2 })}
                >
                  {/* expected (ceiling) */}
                  <div
                    className="relative w-full max-w-8.5 group-hover:brightness-[0.97]"
                    style={{
                      height: expH,
                      background: `${EXPECTED}1f`,
                      border: `1.5px solid ${EXPECTED}66`,
                      borderBottom: 'none',
                      borderRadius: 0,
                      transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 12}ms`,
                      boxShadow: hover?.i === i ? `0 0 0 2px ${EXPECTED}44` : 'none',
                    }}
                  >
                    {/* collected (fill) */}
                    <div
                      className="absolute -left-[1.5px] -right-[1.5px] bottom-0"
                      style={{
                        height: colH,
                        background: FILL_COLLECTED,
                        borderRadius: 0,
                        transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 12 + 60}ms`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* X labels */}
        <div className="flex mt-1.5" style={{ gap }}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[0.6rem] text-gray-400 overflow-hidden whitespace-nowrap">
              {(showEveryLabel || i % step === 0) ? d.label : ''}
            </div>
          ))}
        </div>
        {/* Tooltip */}
        {hover && data[hover.i] && (
          <div
            className="absolute -top-2 pointer-events-none whitespace-nowrap z-10 bg-gray-900 text-(--surface-bg) px-2.5 py-1.75 rounded-lg text-[0.7rem]"
            style={{
              left: Math.min(Math.max(hover.x, 70), 100000),
              transform: 'translate(-50%,-100%)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            }}
          >
            <div className="font-bold mb-0.75">{data[hover.i].label} · {data[hover.i].count} booking{data[hover.i].count === 1 ? '' : 's'}</div>
            <div className="flex items-center gap-1.25"><span className="w-2 h-2 rounded-full" style={{ background: FILL_COLLECTED }} /> Collected {money(data[hover.i].collected)}</div>
            <div className="flex items-center gap-1.25 opacity-85"><span className="w-2 h-2 rounded-full" style={{ background: EXPECTED }} /> Expected {money(data[hover.i].expected)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
