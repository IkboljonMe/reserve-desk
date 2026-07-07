'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { iconRegistry, ServiceIcon } from '@/lib/serviceIcons'
import { useTranslation } from '@/lib/i18n'

// ── Floating icon grid popover ─────────────────────────────────────────────
// Renders as a fixed-position floating panel so it never pushes the parent
// modal's content down. Triggered on hover of the trigger button.

export default function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (name: string) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Position the popover below the trigger using getBoundingClientRect so it
  // is always in viewport regardless of scroll / modal offset.
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 320) })
  }, [])

  const openPopover = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    updatePos()
    setOpen(true)
  }, [updatePos])

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 180)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }, [])

  // Recompute position on scroll / resize while open
  useEffect(() => {
    if (!open) return
    const sync = () => updatePos()
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [open, updatePos])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Clear search filter when popover closes
  useEffect(() => { if (!open) setFilter('') }, [open])

  const results = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return iconRegistry
    return iconRegistry.filter(
      e => e.name.toLowerCase().includes(q) || e.keywords.split(' ').some(k => k.includes(q)),
    )
  }, [filter])

  return (
    <>
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        onFocus={openPopover}
        onClick={openPopover}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 12px',           // same padding as .form-input
          border: `1.5px solid ${open ? 'var(--brand-500)' : 'var(--gray-200)'}`,
          borderRadius: 10,
          background: 'var(--surface-card)',
          boxShadow: open ? '0 0 0 3px rgba(79,110,247,0.14)' : undefined,
          cursor: 'pointer',
          font: 'inherit',
          color: 'var(--gray-700)',
          width: '100%',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          minHeight: 0,
        }}
      >
        {/* Icon badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          background: 'var(--brand-50)', color: 'var(--brand-600)',
          border: '1.5px solid var(--brand-100)',
        }}>
          <ServiceIcon name={value} size={13} />
        </span>

        {/* Icon name */}
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-800)', flex: 1, textAlign: 'left' }}>
          {value || t('chooseAnIcon')}
        </span>

        {/* Hint */}
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 400, whiteSpace: 'nowrap' }}>
          {t('hoverToChange')}
        </span>
      </button>


      {/* ── Floating Popover — rendered in portal-like fixed position ── */}
      {open && (
        <div
          ref={popoverRef}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
            background: 'var(--surface-card)',
            border: '1.5px solid var(--brand-100)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-xl)',
            animation: 'slideUp 0.18s cubic-bezier(0.16,1,0.3,1)',
            overflow: 'hidden',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', padding: '10px 10px 0' }}>
            <Search
              size={14}
              style={{
                position: 'absolute', left: 20, top: '50%',
                transform: 'translateY(-25%)',
                color: 'var(--gray-400)', pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
            <input
              type="text"
              className="form-input"
              placeholder={t('searchIcons')}
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label={t('filterIcons')}
              autoFocus
              style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: '0.8rem' }}
            />
          </div>

          {/* Icon grid */}
          {results.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray-400)' }}>
              {t('noIconsMatch', { query: filter })}{' '}
              <button type="button" onClick={() => setFilter('')} style={{ background: 'none', border: 'none', color: 'var(--brand-600)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                {t('clear')}
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
              gap: 3,
              padding: 10,
              maxHeight: 220,
              overflowY: 'auto',
            }}>
              {results.map(({ name, Icon }) => {
                const selected = value === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { onChange(name); setOpen(false) }}
                    aria-label={name}
                    aria-pressed={selected}
                    title={name}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: 40, borderRadius: 8, cursor: 'pointer',
                      border: selected ? '1.5px solid var(--brand-500)' : '1.5px solid transparent',
                      background: selected ? 'var(--brand-50)' : 'transparent',
                      color: selected ? 'var(--brand-600)' : 'var(--gray-600)',
                      transition: 'background 0.1s, border-color 0.1s',
                    }}
                    onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--gray-100)' }}
                    onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '6px 12px',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '0.7rem', color: 'var(--gray-400)',
          }}>
            <span className="tabular-nums">{t('iconsCount', { count: results.length })}</span>
            {value && <span style={{ color: 'var(--brand-600)', fontWeight: 600 }}>{value}</span>}
          </div>
        </div>
      )}
    </>
  )
}
