import type { DictionaryKeys } from '@/i18n'
import type { NotificationTier } from '@/types'

export const TIER_META: Record<NotificationTier, { labelKey: DictionaryKeys; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  expired: {
    labelKey: 'tierExpired',
    color: 'var(--danger)',
    bg: 'rgba(239,68,68,0.09)',
    border: 'rgba(239,68,68,0.28)',
    icon: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  },
  urgent: {
    labelKey: 'tierUrgent',
    color: '#c2410c',
    bg: 'rgba(234,88,12,0.08)',
    border: 'rgba(234,88,12,0.26)',
    icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  },
  warning: {
    labelKey: 'tierUpcoming',
    color: '#b7791f',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.28)',
    icon: <><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></>,
  },
}

export const TIER_ORDER: NotificationTier[] = ['expired', 'urgent', 'warning']
