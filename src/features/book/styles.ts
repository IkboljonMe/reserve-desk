import type React from 'react'

export function chipStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 999,
    background: bg, color, fontWeight: 600, fontSize: '0.75rem',
  }
}

export function optionCardStyle(active: boolean, accent: string): React.CSSProperties {
  return {
    border: `2px solid ${active ? accent : 'var(--gray-200)'}`,
    borderRadius: 12, padding: '1rem', textAlign: 'left', cursor: 'pointer',
    background: active ? `${accent}12` : '#fff', transition: 'all 0.15s ease',
  }
}
