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
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`.trim()}>
        {label && (
          <label htmlFor={inputId} className="text-[0.8125rem] font-semibold text-gray-700 tracking-tight">
            {label}
          </label>
        )}

        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-gray-400 pointer-events-none">
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
            className={`w-full border-[1.5px] rounded-[10px] bg-surface-card text-gray-800 text-sm outline-none transition-all duration-150 hover:border-gray-300 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed ${
              error
                ? 'border-danger focus:border-danger focus:ring-3 focus:ring-danger/14'
                : 'border-gray-200 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/14'
            } ${hasLeftIcon ? 'pl-9' : 'pl-3'} ${hasRightIcon ? 'pr-9' : 'pr-3'} ${className}`.trim()}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-gray-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span id={errorId} className="text-xs text-danger font-medium">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="text-xs text-gray-500">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
