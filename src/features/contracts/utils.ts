import { formatUZ } from '@/lib/timezone'

// Whole-day difference to the finish date in local terms. Negative = expired.
export function daysLeftOf(finishDate: string | null): number | null {
  if (!finishDate) return null
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const f = new Date(finishDate)
  const target = Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate())
  return Math.round((target - today) / 86_400_000)
}

export function fmtDate(d: string | null): string {
  if (!d) return '—'
  return formatUZ(d, { day: '2-digit', month: 'short', year: 'numeric' })
}
