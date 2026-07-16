import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'blue' | 'gray'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-brand-50 text-brand-700 border-brand-100',
  gray: 'bg-gray-100 text-gray-700 border-transparent',
}

export function Badge({
  variant = 'gray',
  className = '',
  children,
}: {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-xs font-semibold tracking-[0.01em] border ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  )
}
