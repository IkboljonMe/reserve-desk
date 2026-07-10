'use client'

import { useState, useId } from 'react'
import { Info } from 'lucide-react'

// A small "i" icon that reveals a help tooltip on hover/focus (and toggles on
// click for touch). Used next to form-field labels so admins can read what a
// field is for.
export function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', marginLeft: 5, verticalAlign: 'middle' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={text}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, padding: 0, border: 'none', background: 'none',
          cursor: 'help', color: 'var(--gray-400)',
        }}
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, width: 'max-content', maxWidth: 240,
            background: 'var(--gray-800, #1f2937)', color: '#fff',
            fontSize: '0.72rem', fontWeight: 400, lineHeight: 1.4,
            padding: '6px 9px', borderRadius: 7, boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
            whiteSpace: 'normal', textAlign: 'left', pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

export default InfoHint
