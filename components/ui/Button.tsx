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
  return (
    <button
      className={`rd-btn rd-btn-${variant} rd-btn-${size} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      <style>{`
        .rd-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          white-space: nowrap;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }
        .rd-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .rd-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Variants */
        .rd-btn-primary {
          background: linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(79, 110, 247, 0.25);
        }
        .rd-btn-primary:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 6px 18px rgba(79, 110, 247, 0.35);
        }
        .rd-btn-secondary {
          background: #ffffff;
          color: var(--gray-700, #374151);
          border-color: var(--gray-200, #e5e7eb);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .rd-btn-secondary:hover:not(:disabled) {
          background: var(--gray-5, #f9fafb);
          border-color: var(--gray-300, #d1d5db);
        }
        .rd-btn-danger {
          background: #fee2e2;
          color: var(--danger, #ef4444);
          border-color: #fecaca;
        }
        .rd-btn-danger:hover:not(:disabled) {
          background: #fecaca;
        }
        .rd-btn-ghost {
          background: transparent;
          color: var(--gray-600, #4b5563);
        }
        .rd-btn-ghost:hover:not(:disabled) {
          background: var(--gray-100, #f3f4f6);
          color: var(--gray-800, #1f2937);
        }

        /* Sizes */
        .rd-btn-sm {
          padding: 6px 12px;
          font-size: 0.8125rem;
          border-radius: 6px;
        }
        .rd-btn-md {
          padding: 8px 16px;
          font-size: 0.875rem;
          border-radius: 8px;
          min-height: 38px;
        }
        .rd-btn-lg {
          padding: 10px 20px;
          font-size: 0.9375rem;
          border-radius: 8px;
          min-height: 44px;
        }

        /* Spinner animation */
        @keyframes rd-spin {
          to { transform: rotate(360deg); }
        }
        .rd-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: rd-spin 0.6s linear infinite;
        }
        .rd-btn-secondary .rd-spinner, .rd-btn-ghost .rd-spinner {
          border-color: rgba(99, 102, 241, 0.2);
          border-top-color: var(--brand-500, #6366f1);
        }
      `}</style>

      {loading ? (
        <span
          className="rd-spinner"
          style={{ marginRight: children ? '4px' : '0px' }}
          aria-hidden="true"
        />
      ) : leftIcon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {leftIcon}
        </span>
      ) : null}

      {children}

      {!loading && rightIcon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {rightIcon}
        </span>
      ) : null}
    </button>
  )
}
