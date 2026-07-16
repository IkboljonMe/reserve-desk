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
      <div className="text-[0.68rem] font-bold text-gray-400 uppercase tracking-[0.05em] flex items-center gap-[5px]">
        {dot && <span className="w-2 h-2 rounded-full" style={{ background: dot }} />}{label}
      </div>
      <div className="text-2xl font-[800] leading-[1.1] mt-1 tracking-[-0.02em] tabular-nums" style={{ color }}>
        {value}{unit && <span className="text-[0.72rem] font-semibold text-gray-400 ml-1">{unit}</span>}
      </div>
    </div>
  )
}
