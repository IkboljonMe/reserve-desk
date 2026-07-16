'use client'

import React, { forwardRef, useId } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName = '',
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const hasLeftIcon = !!leftIcon
    const hasRightIcon = !!rightIcon

    return (
      <div className={`flex flex-col gap-1.5 w-full box-border ${containerClassName}`.trim()}>
        {label && (
          <label htmlFor={inputId} className="text-[0.8125rem] font-semibold text-[var(--gray-700,#374151)] tracking-tight">
            {label}
          </label>
        )}

        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-[var(--gray-400,#9ca3af)] pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`w-full min-h-[38px] border-1.5 border-[var(--gray-200,#e5e7eb)] rounded-lg bg-white text-sm font-medium text-[var(--gray-800,#1f2937)] outline-none transition-all duration-150 box-border font-sans hover:not-disabled:border-[var(--gray-300,#d1d5db)] focus:border-[var(--brand-500,#6366f1)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.14)] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--gray-50,#f9fafb)] ${
              error ? 'border-[var(--color-danger,#ef4444)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]' : ''
            } ${className}`}
            style={{
              paddingLeft: hasLeftIcon ? '34px' : '12px',
              paddingRight: hasRightIcon ? '34px' : '12px',
            }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-[var(--gray-400,#9ca3af)] pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span id={errorId} className="text-[0.75rem] text-[var(--color-danger,#ef4444)] font-medium">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="text-[0.75rem] text-[var(--gray-500,#6b7280)]">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
