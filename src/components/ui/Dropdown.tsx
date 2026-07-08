'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

export interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  icon?: React.ReactNode
  ariaLabel?: string
  containerClassName?: string
}

export default function Dropdown({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select…',
  error,
  disabled = false,
  icon,
  ariaLabel,
  containerClassName = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const selected = options.find(o => o.value === value) || null

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function openList() {
    if (disabled) return
    const idx = options.findIndex(o => o.value === value)
    setActiveIndex(idx >= 0 ? idx : 0)
    setOpen(true)
  }

  function choose(idx: number) {
    const opt = options[idx]
    if (opt) {
      onChange(opt.value)
      setOpen(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openList()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => Math.min(options.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(activeIndex)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className={`rd-dropdown-container ${containerClassName}`.trim()}>
      <style>{`
        .rd-dropdown-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          position: relative;
          box-sizing: border-box;
        }
        .rd-dropdown-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--gray-700, #374151);
          letter-spacing: -0.01em;
        }
        .rd-dropdown-trigger-wrapper {
          position: relative;
          width: 100%;
        }
        .rd-dropdown-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          min-height: 38px;
          border: 1.5px solid var(--gray-200, #e5e7eb);
          border-radius: 8px;
          background: var(--white, #ffffff);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--gray-800, #1f2937);
          cursor: pointer;
          outline: none;
          text-align: left;
          transition: all 0.15s ease;
          box-sizing: border-box;
        }
        .rd-dropdown-trigger:hover:not(:disabled) {
          border-color: var(--gray-300, #d1d5db);
        }
        .rd-dropdown-trigger:focus-visible {
          border-color: var(--brand-500, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
        }
        .rd-dropdown-trigger.open-state {
          border-color: var(--brand-500, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
        }
        .rd-dropdown-trigger.error-state {
          border-color: var(--danger, #ef4444);
        }
        .rd-dropdown-trigger.error-state:focus-visible {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
        }
        .rd-dropdown-trigger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--gray-50, #f9fafb);
        }
        .rd-dropdown-text {
          flex: 1;
          min-w: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rd-dropdown-text.has-value {
          color: var(--gray-800, #1f2937);
        }
        .rd-dropdown-text.placeholder {
          color: var(--gray-400, #9ca3af);
        }
        .rd-dropdown-list {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 9999;
          list-style: none;
          margin: 0;
          padding: 4px;
          background: #ffffff;
          border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          max-height: 240px;
          overflow-y: auto;
          box-sizing: border-box;
        }
        .rd-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--gray-700, #374151);
          transition: all 0.1s ease;
          box-sizing: border-box;
        }
        .rd-dropdown-item:hover {
          background: var(--gray-50, #f9fafb);
          color: var(--gray-900, #111827);
        }
        .rd-dropdown-item.active {
          background: var(--gray-100, #f3f4f6);
          color: var(--gray-900, #111827);
        }
        .rd-dropdown-item.selected {
          font-weight: 600;
          color: var(--brand-700, #4338ca);
          background: var(--brand-50, #e0e7ff);
        }
        .rd-dropdown-item.selected.active {
          background: var(--brand-100, #c7d2fe);
        }
        .rd-dropdown-error {
          font-size: 0.75rem;
          color: var(--danger, #ef4444);
          font-weight: 500;
        }
      `}</style>

      {label && (
        <span className="rd-dropdown-label">
          {label}
        </span>
      )}

      <div className="rd-dropdown-trigger-wrapper">
        <button
          type="button"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel || label}
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          className={`rd-dropdown-trigger ${open ? 'open-state' : ''} ${error ? 'error-state' : ''}`}
        >
          {icon && (
            <span style={{ display: 'inline-flex', flexShrink: 0, color: 'var(--brand-600)' }}>
              {icon}
            </span>
          )}
          <span
            className={`rd-dropdown-text ${
              selected && selected.value ? 'has-value' : 'placeholder'
            }`}
          >
            {selected && selected.value ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            style={{
              flexShrink: 0,
              color: 'var(--gray-400)',
              transition: 'transform 0.15s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            className="rd-dropdown-list"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value
              const isActive = idx === activeIndex

              return (
                <li
                  key={opt.value || '__placeholder'}
                  id={`${listId}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={e => {
                    e.preventDefault()
                    choose(idx)
                  }}
                  className={`rd-dropdown-item ${isSelected ? 'selected' : ''} ${isActive && !isSelected ? 'active' : ''}`}
                >
                  <span className="rd-dropdown-text has-value">
                    {opt.label}
                  </span>
                  {isSelected && <Check size={15} aria-hidden="true" style={{ flexShrink: 0 }} />}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {error && (
        <span className="rd-dropdown-error">
          {error}
        </span>
      )}
    </div>
  )
}
