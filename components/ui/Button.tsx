'use client'

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Base classes (resets and defaults)
  const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer transition-all duration-150 active:translate-y-px active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/30 border border-transparent whitespace-nowrap tracking-tight rounded-radius-sm'

  // Variant classes using Tailwind 4 theme mapping
  const variantClasses = {
    primary: 'bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] text-white shadow-brand hover:brightness-106 hover:shadow-[0_8px_20px_rgba(79,110,247,0.36)] hover:-translate-y-px',
    secondary: 'bg-surface-card text-gray-700 border-gray-200 shadow-xs hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-px hover:shadow-sm',
    danger: 'bg-[#fee2e2] text-danger border-[#fecaca] hover:bg-[#fecaca]',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800',
  }[variant]

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[0.8125rem]',
    md: 'px-4 py-[9px] text-sm',
    lg: 'px-5.5 py-[11px] text-[0.9375rem]',
  }[size]

  const isDarkSpinner = variant === 'secondary' || variant === 'ghost'
  const spinnerColorClass = isDarkSpinner ? 'border-brand-500/20 border-t-brand-500' : 'border-white/30 border-t-white'

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className={`w-4.5 h-4.5 border-2 rounded-full animate-spin inline-block ${spinnerColorClass}`}
          style={{ marginRight: children ? '6px' : '0px' }}
          aria-hidden="true"
        />
      ) : leftIcon ? (
        <span className="inline-flex items-center justify-center">
          {leftIcon}
        </span>
      ) : null}

      {children}

      {!loading && rightIcon ? (
        <span className="inline-flex items-center justify-center">
          {rightIcon}
        </span>
      ) : null}
    </button>
  )
}
