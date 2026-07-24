import { useId } from 'react'
import type { LanguageCode } from './config'

// Inline SVG flags for the locale switcher. We can't use the emoji flags
// (🇺🇿/🇷🇺/🇬🇧) because Windows ships no glyphs for regional-indicator
// sequences, so on desktop browsers they render as blank/tofu. SVG renders
// identically on every platform. Sharp corners to match the app-wide design.
export function FlagIcon({
  code,
  height = 14,
  className,
}: {
  code: LanguageCode
  height?: number
  className?: string
}) {
  const uid = useId()
  const common = { height, role: 'img' as const, className }

  if (code === 'ru') {
    // White / blue / red horizontal tricolour.
    return (
      <svg {...common} viewBox="0 0 9 6" aria-label="Русский">
        <rect width="9" height="6" fill="#fff" />
        <rect y="2" width="9" height="4" fill="#0039A6" />
        <rect y="4" width="9" height="2" fill="#D52B1E" />
      </svg>
    )
  }

  if (code === 'en') {
    // Union Jack — canonical minimal construction with counterchanged
    // diagonals via a triangular clip.
    const clip = `uk-${uid}`
    return (
      <svg {...common} viewBox="0 0 60 30" aria-label="English">
        <clipPath id={clip}>
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath={`url(#${clip})`}
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </svg>
    )
  }

  // Uzbekistan — blue / white / green with thin red fimbriations and a
  // white crescent in the hoist of the blue band.
  const carve = `uz-${uid}`
  return (
    <svg {...common} viewBox="0 0 12 6" aria-label="O'zbekcha">
      <rect width="12" height="2" fill="#0099B5" />
      <rect y="2" width="12" height="2" fill="#fff" />
      <rect y="4" width="12" height="2" fill="#1EB53A" />
      <rect y="1.85" width="12" height="0.3" fill="#CE1126" />
      <rect y="3.85" width="12" height="0.3" fill="#CE1126" />
      <mask id={carve}>
        <circle cx="2" cy="1" r="0.75" fill="#fff" />
        <circle cx="2.35" cy="1" r="0.75" fill="#000" />
      </mask>
      <rect x="1" y="0" width="2.2" height="2" fill="#fff" mask={`url(#${carve})`} />
    </svg>
  )
}
