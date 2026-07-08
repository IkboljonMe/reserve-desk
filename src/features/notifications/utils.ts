import { formatUZ } from '@/lib/timezone'

export function fmtDate(d: string | null): string {
  if (!d) return '—'
  return formatUZ(d, { day: '2-digit', month: 'short', year: 'numeric' })
}
