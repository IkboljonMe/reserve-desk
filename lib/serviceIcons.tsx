import React from 'react'

// Service icon map — keyword-based matching
// Each entry: array of keywords (lowercase) → icon
interface IconEntry {
  keywords: string[]
  icon: React.ReactElement
}

const W = 20
const H = 20
const STROKE = 1.75

export const availableIcons: IconEntry[] = [
  {
    keywords: ['pool', 'swim', 'aqua', 'water'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
        <path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
        <circle cx="7" cy="5" r="2"/>
        <path d="M7 7v4l3 3"/>
      </svg>
    ),
  },
  {
    keywords: ['gym', 'fitness', 'sport', 'exercise', 'workout', 'training'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4v6M18 4v6M2 9h4M18 9h4M6 20v-6M18 20v-6M2 15h4M18 15h4"/>
        <rect x="10" y="9" width="4" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    keywords: ['spa', 'relax', 'wellness', 'beauty', 'facial'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22C6 22 2 17.5 2 12c0-2 .5-4 1.5-5.5C5 4 7 3 9 3s4 1.5 3 4c1.5-2.5 4-3 6-3 2 0 3.5 1.5 3.5 4C22 17.5 18 22 12 22z"/>
        <path d="M12 22v-8"/>
      </svg>
    ),
  },
  {
    keywords: ['massage', 'therapy', 'body'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"/>
        <circle cx="12" cy="8" r="2"/>
        <path d="M5 20a7 7 0 0 1 14 0"/>
        <path d="M12 14v2"/>
      </svg>
    ),
  },
  {
    keywords: ['restaurant', 'dining', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'cafe', 'bar'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
  },
  {
    keywords: ['sauna', 'steam', 'hammam', 'jacuzzi', 'hot'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9z"/>
        <path d="M16 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9z"/>
        <path d="M4 22h16"/>
      </svg>
    ),
  },
  {
    keywords: ['tennis', 'court', 'sport court', 'padel', 'badminton'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M6.3 6.3a8 8 0 0 0 11.4 11.4"/>
        <path d="M17.7 6.3a8 8 0 0 0-11.4 11.4"/>
      </svg>
    ),
  },
  {
    keywords: ['laundry', 'wash', 'cleaning', 'dry', 'ironing'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="18" height="20" rx="2"/>
        <circle cx="12" cy="13" r="5"/>
        <circle cx="8" cy="6" r="1" fill="currentColor"/>
        <circle cx="12" cy="6" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    keywords: ['parking', 'car', 'garage', 'valet'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
      </svg>
    ),
  },
  {
    keywords: ['room', 'meeting', 'conference', 'hall', 'event'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    keywords: ['transfer', 'transport', 'shuttle', 'taxi', 'airport'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5h-2"/>
        <circle cx="7.5" cy="17.5" r="2.5"/>
        <circle cx="17.5" cy="17.5" r="2.5"/>
      </svg>
    ),
  },
  {
    keywords: ['golf'],
    icon: (
      <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="19" r="2"/>
        <path d="M12 17V5l7 4-7 4"/>
      </svg>
    ),
  },
]

// Fallback icon (calendar/booking)
const fallbackIcon = (
  <svg width={W} height={H} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

export function getServiceIcon(serviceName: string): React.ReactElement {
  const lower = serviceName.toLowerCase()
  for (const entry of availableIcons) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.icon
    }
  }
  return fallbackIcon
}
