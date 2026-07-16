'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

/**
 * A styled, accessible single-select dropdown (listbox pattern) that matches
 * the app's modal styling. Keeps focus on the trigger and drives the list via
 * aria-activedescendant, with full keyboard support.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  icon,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  icon?: React.ReactNode
  ariaLabel?: string
}) {
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
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="w-full flex items-center gap-2.5 py-2.5 px-3 border-[1.5px] border-gray-200 rounded-[10px] bg-surface-card font-[inherit] text-[0.8125rem] font-medium text-gray-700 cursor-pointer outline-none text-left transition-[border-color,box-shadow] duration-150 ease-[ease] hover:border-gray-300 focus-visible:border-brand-500 focus-visible:shadow-[0_0_0_3px_rgba(79,110,247,0.14)] aria-expanded:border-brand-500 aria-expanded:shadow-[0_0_0_3px_rgba(79,110,247,0.14)]"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
      >
        {icon && <span style={{ display: 'inline-flex', flexShrink: 0, color: 'var(--brand-600)' }}>{icon}</span>}
        <span
          style={{
            flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: selected && selected.value ? 'var(--gray-800)' : 'var(--gray-400)',
          }}
        >
          {selected && selected.value ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{
            flexShrink: 0, color: 'var(--gray-400)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
            listStyle: 'none', margin: 0, padding: 4,
            background: '#fff',
            border: '1px solid var(--gray-200)', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
            maxHeight: 240, overflowY: 'auto',
          }}
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
                onMouseDown={e => { e.preventDefault(); choose(idx) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.8125rem', fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? 'var(--brand-700)' : 'var(--gray-700)',
                  background: isActive
                    ? (isSelected ? 'var(--brand-100)' : 'var(--gray-100)')
                    : (isSelected ? 'var(--brand-50)' : 'transparent'),
                  transition: 'background 0.1s ease',
                }}
              >
                <span
                  style={{
                    flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: opt.value === '' ? 'var(--gray-400)' : undefined,
                  }}
                >
                  {opt.label}
                </span>
                {isSelected && <Check size={15} aria-hidden="true" style={{ flexShrink: 0 }} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
