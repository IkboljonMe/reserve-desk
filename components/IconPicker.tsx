'use client'

import { useId, useMemo, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { iconRegistry, ServiceIcon } from '@/lib/serviceIcons'

export default function IconPicker({
  value,
  onChange,
  defaultOpen = true,
}: {
  value: string
  onChange: (name: string) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [filter, setFilter] = useState('')
  const panelId = useId()

  const results = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return iconRegistry
    return iconRegistry.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.keywords.split(' ').some(k => k.includes(q)),
    )
  }, [filter])

  return (
    <div
      style={{
        border: '1.5px solid var(--gray-200)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--surface-card)',
      }}
    >
      {/* Collapsible header bar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          font: 'inherit',
          color: 'var(--gray-700)',
        }}
      >
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            background: 'var(--brand-50)', color: 'var(--brand-600)',
          }}
        >
          <ServiceIcon name={value} size={15} />
        </span>
        <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {value || 'Choose an icon'}
          </span>
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
          {open ? 'Hide' : 'Change'}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: 'var(--gray-400)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {open && (
        <div id={panelId} style={{ borderTop: '1px solid var(--surface-border)' }}>
          {/* Filter */}
          <div style={{ position: 'relative', padding: 8, borderBottom: '1px solid var(--surface-border)' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }}
              aria-hidden="true"
            />
            <input
              type="text"
              className="form-input"
              placeholder="Filter icons…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label="Filter icons"
              style={{ paddingLeft: 32 }}
            />
          </div>

          {/* Grid */}
          {results.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
              <p style={{ fontSize: '0.8125rem' }}>No icons match “{filter}”.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilter('')}>
                Clear filter
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                gap: 4,
                padding: 8,
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {results.map(({ name, Icon }) => {
                const selected = value === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onChange(name)}
                    aria-label={name}
                    aria-pressed={selected}
                    title={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 42,
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: selected ? '1.5px solid var(--brand-500)' : '1.5px solid transparent',
                      background: selected ? 'var(--brand-50)' : 'transparent',
                      color: selected ? 'var(--brand-600)' : 'var(--gray-600)',
                      transition: 'background 0.12s ease, border-color 0.12s ease',
                    }}
                    onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--gray-100)' }}
                    onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Footer: result count */}
          <div
            className="tabular-nums"
            style={{
              padding: '6px 10px',
              borderTop: '1px solid var(--surface-border)',
              fontSize: '0.7rem',
              color: 'var(--gray-400)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{results.length} icons</span>
            {value && <span style={{ color: 'var(--brand-600)', fontWeight: 500 }}>{value}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
