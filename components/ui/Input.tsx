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
      <div className={`rd-input-container ${containerClassName}`.trim()}>
        <style>{`
          .rd-input-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            width: 100%;
            box-sizing: border-box;
          }
          .rd-input-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--gray-700, #374151);
            letter-spacing: -0.01em;
          }
          .rd-input-wrapper {
            position: relative;
            width: 100%;
          }
          .rd-input-field {
            width: 100%;
            padding: 8px 12px;
            min-height: 38px;
            border: 1.5px solid var(--gray-200, #e5e7eb);
            border-radius: 8px;
            background: var(--white, #ffffff);
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--gray-800, #1f2937);
            outline: none;
            transition: all 0.15s ease;
            box-sizing: border-box;
            font-family: inherit;
          }
          .rd-input-field:hover:not(:disabled) {
            border-color: var(--gray-300, #d1d5db);
          }
          .rd-input-field:focus {
            border-color: var(--brand-500, #6366f1);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
          }
          .rd-input-field.error-state {
            border-color: var(--danger, #ef4444);
          }
          .rd-input-field.error-state:focus {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
          }
          .rd-input-field:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: var(--gray-50, #f9fafb);
          }
          .rd-input-icon-left {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--gray-400, #9ca3af);
            pointer-events: none;
          }
          .rd-input-icon-right {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--gray-400, #9ca3af);
            pointer-events: none;
          }
          .rd-input-error {
            font-size: 0.75rem;
            color: var(--danger, #ef4444);
            font-weight: 500;
          }
          .rd-input-helper {
            font-size: 0.75rem;
            color: var(--gray-500, #6b7280);
          }
        `}</style>

        {label && (
          <label htmlFor={inputId} className="rd-input-label">
            {label}
          </label>
        )}

        <div className="rd-input-wrapper">
          {leftIcon && (
            <div className="rd-input-icon-left">
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
            className={`rd-input-field ${error ? 'error-state' : ''} ${className}`}
            style={{
              paddingLeft: hasLeftIcon ? '34px' : '12px',
              paddingRight: hasRightIcon ? '34px' : '12px',
            }}
            {...props}
          />

          {rightIcon && (
            <div className="rd-input-icon-right">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span id={errorId} className="rd-input-error">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="rd-input-helper">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
