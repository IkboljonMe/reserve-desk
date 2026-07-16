'use client'

import { useEffect, useRef, useState } from 'react'
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react'
import { useTheme, type Theme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop },
  ]

  const activeOption = options.find(o => o.value === theme) || options[2]
  const ActiveIcon = activeOption.icon

  return (
    <div ref={rootRef} className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-[105px] h-[38px] px-3.5 inline-flex items-center justify-between rounded-[10px] bg-[var(--gray-100)] hover:bg-[var(--gray-200)] text-[var(--gray-700)] cursor-pointer border border-[var(--surface-border)] transition-all duration-150 text-[0.8rem] font-semibold"
      >
        <span className="flex items-center gap-1.75">
          <ActiveIcon size={14} className="shrink-0" />
          {activeOption.label}
        </span>
        <ChevronDown size={12} className={`shrink-0 text-[var(--gray-400)] transition-transform duration-150 ${open ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {open && (
        <ul className="absolute top-[calc(100%+6px)] right-0 z-[9999] list-none m-0 p-1 bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[10px] shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] w-[120px] box-border">
          {options.map(opt => {
            const isSelected = opt.value === theme
            const OptIcon = opt.icon
            return (
              <li
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value)
                  setOpen(false)
                }}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-[0.8rem] transition-all duration-100 ease-in-out box-border ${
                  isSelected
                    ? 'font-bold text-[var(--brand-600)] bg-[var(--sidebar-hover)]'
                    : 'text-[var(--gray-700)] hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]'
                }`}
              >
                <span className="flex items-center gap-1.75">
                  <OptIcon size={13} className="shrink-0" />
                  {opt.label}
                </span>
                {isSelected && <Check size={13} className="shrink-0 text-[var(--brand-500)]" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
