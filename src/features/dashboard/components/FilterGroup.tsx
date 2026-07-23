'use client'

export function FilterGroup({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-0.75 text-[0.7rem] text-gray-400 font-bold whitespace-nowrap">
        {icon}{label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  )
}
