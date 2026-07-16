'use client'

export function StatCard({ label, value, tint, tintBg, icon }: { label: string; value: number; tint: string; tintBg: string; icon: 'doc' | 'check' | 'clock' | 'alert' }) {
  const paths: Record<typeof icon, React.ReactNode> = {
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  }
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[var(--radius-lg)] shadow-sm flex items-center gap-3.5 p-[1rem_1.1rem]">
      <div
        className="w-10.5 h-10.5 rounded-[11px] flex items-center justify-center shrink-0"
        style={{ background: tintBg, color: tint }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[icon]}</svg>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-[var(--gray-900)] leading-none">{value}</div>
        <div className="text-[0.75rem] text-[var(--gray-500)] mt-1 font-medium">{label}</div>
      </div>
    </div>
  )
}
