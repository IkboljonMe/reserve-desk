'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-sm border border-transparent text-sm font-semibold cursor-pointer whitespace-nowrap tracking-[-0.01em] transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 ' +
  'active:enabled:translate-y-px active:enabled:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(79,110,247,0.3)]'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[image:var(--brand-gradient)] text-white shadow-brand ' +
    'hover:enabled:brightness-[1.06] hover:enabled:shadow-[0_8px_20px_rgba(79,110,247,0.36)] hover:enabled:-translate-y-px',
  secondary:
    'bg-surface-card text-gray-700 border-gray-200 shadow-xs ' +
    'hover:enabled:bg-gray-50 hover:enabled:border-gray-300 hover:enabled:-translate-y-px hover:enabled:shadow-sm',
  danger:
    'bg-red-100 text-danger border-red-200 hover:enabled:bg-red-200',
  ghost:
    'bg-transparent text-gray-600 hover:enabled:bg-gray-100 hover:enabled:text-gray-800',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'py-[6px] px-3 text-[0.8125rem]',
  md: 'py-[9px] px-4',
  lg: 'py-[11px] px-[22px] text-[0.9375rem]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const dark = variant === 'secondary' || variant === 'ghost'
  return (
    <button
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${icon ? 'p-2' : SIZE_CLASSES[size]} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size={16} dark={dark} className={children ? 'mr-1' : ''} />
      ) : leftIcon ? (
        <span className="inline-flex items-center">{leftIcon}</span>
      ) : null}

      {children}

      {!loading && rightIcon ? <span className="inline-flex items-center">{rightIcon}</span> : null}
    </button>
  )
}
