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
  return <Skeleton style={{ height: 14, width, borderRadius: 4 }} />
}

export function SkeletonTableRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} style={{ padding: '12px 16px' }}>
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '1.25rem',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-card)',
        ...style,
      }}
    >
      <Skeleton style={{ height: 12, width: '40%' }} />
      <Skeleton style={{ height: 28, width: '60%' }} />
      <Skeleton style={{ height: 12, width: '30%' }} />
    </div>
  )
}
