import type { CSSProperties, ReactNode } from 'react'

// Standard "nothing here yet" placeholder: a soft brand-tinted icon tile
// above whatever content the caller needs (title, description, action button).
export function EmptyState({
  icon,
  iconClassName = '',
  iconStyle,
  className = '',
  style,
  children,
}: {
  icon: ReactNode
  iconClassName?: string
  iconStyle?: CSSProperties
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center gap-3 ${className}`} style={style}>
      <div
        className={`w-[60px] h-[60px] flex items-center justify-center rounded-[18px] bg-[image:var(--brand-gradient-soft)] border border-brand-100 text-brand-500 ${iconClassName}`}
        style={iconStyle}
      >
        {icon}
      </div>
      {children}
    </div>
  )
}
