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

  // Determine trigger styling
  const triggerBorderClass = error
    ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/14'
    : open
    ? 'border-brand-500 ring-3 ring-brand-500/14'
    : 'border-gray-200 focus-visible:border-brand-500 focus-visible:ring-brand-500/14'

  return (
    <div ref={rootRef} className={`flex flex-col gap-1.5 w-full relative ${containerClassName}`.trim()}>
      {label && (
        <span className="text-[0.8125rem] font-semibold text-gray-700 tracking-tight">
          {label}
        </span>
      )}

      <div className="relative">
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
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-[1.5px] rounded-[10px] bg-surface-card text-[0.8125rem] font-medium text-gray-700 cursor-pointer outline-none text-left transition-all duration-150 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed ${triggerBorderClass}`}
        >
          {icon && (
            <span className="inline-flex flex-shrink-0 text-brand-600">
              {icon}
            </span>
          )}
          <span
            className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
              selected && selected.value ? 'text-gray-800' : 'text-gray-400'
            }`}
          >
            {selected && selected.value ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`flex-shrink-0 text-gray-400 transition-transform duration-150 ${
              open ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 list-none m-0 p-1 bg-white border border-gray-200 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.14)] max-h-60 overflow-y-auto"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value
              const isActive = idx === activeIndex
              
              // Option background color classes
              const optionBgClass = isActive
                ? isSelected
                  ? 'bg-brand-100'
                  : 'bg-gray-100'
                : isSelected
                ? 'bg-brand-50'
                : 'bg-transparent'

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
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-[0.8125rem] transition-colors duration-100 ${
                    isSelected ? 'font-semibold text-brand-700' : 'font-medium text-gray-700'
                  } ${optionBgClass}`}
                >
                  <span
                    className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${
                      opt.value === '' ? 'text-gray-400' : ''
                    }`}
                  >
                    {opt.label}
                  </span>
                  {isSelected && <Check size={15} aria-hidden="true" className="flex-shrink-0" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {error && (
        <span className="text-xs text-danger font-medium">
          {error}
        </span>
      )}
    </div>
  )
}
