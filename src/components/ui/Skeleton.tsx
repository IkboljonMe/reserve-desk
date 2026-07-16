import type { CSSProperties } from 'react'

export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />
}

export function SkeletonText({ width = '100%' }: { width?: string | number }) {
  return <Skeleton className="h-3.5 rounded-[4px]" style={{ width }} />
}

export function SkeletonTableRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="p-[12px_16px]">
              <SkeletonText width={c === 0 ? '70%' : '50%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function SkeletonCard({ style }: { style?: CSSProperties }) {
  return (
    <div
      className="flex flex-col gap-2.5 p-5 border border-[var(--surface-border)] rounded-[var(--radius-lg)] bg-[var(--surface-card)]"
      style={style}
    >
      <Skeleton className="h-3" style={{ width: '40%' }} />
      <Skeleton className="h-7" style={{ width: '60%' }} />
      <Skeleton className="h-3" style={{ width: '30%' }} />
    </div>
  )
}
