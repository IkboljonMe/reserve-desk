import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { nowUZ } from '@/lib/timezone'

export type PaymentFilter = 'all' | 'paid' | 'unpaid' | 'free'
export type TypeFilter = 'all' | 'client' | 'room' | 'custom'
export type StateFilter = 'all' | 'active' | 'finished'
export type PeriodKey = 'week' | 'month' | '7d' | '30d' | 'custom'
export type SortKey = 'date' | 'price' | 'created'

export function periodRange(key: PeriodKey, customFrom: string, customTo: string): { from: string; to: string } {
  const now = nowUZ()
  const f = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (key) {
    case 'week': return { from: f(startOfWeek(now, { weekStartsOn: 1 })), to: f(endOfWeek(now, { weekStartsOn: 1 })) }
    case 'month': return { from: f(startOfMonth(now)), to: f(endOfMonth(now)) }
    case '7d': return { from: f(subDays(now, 6)), to: f(now) }
    case '30d': return { from: f(subDays(now, 29)), to: f(now) }
    case 'custom': return { from: customFrom, to: customTo }
  }
}
