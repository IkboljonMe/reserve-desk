import React from 'react'

interface DashboardKpiProps {
  label: string
  value: string
  unit?: string
  color: string
  dot?: string
}

export default function DashboardKpi({ label, value, unit, color, dot }: DashboardKpiProps) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />}{label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
        {value}{unit && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-400)', marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  )
}
