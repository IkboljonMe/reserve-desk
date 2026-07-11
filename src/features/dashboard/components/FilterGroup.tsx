'use client'

export function FilterGroup({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 700, whiteSpace: 'nowrap' }}>{icon}{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}
