// Resolving a service's effective opening hours for a specific date.
//
// A service has a flat `openTime`/`closeTime` that applies to every day. On top
// of that it may define:
//   - `weeklyHours`: per-weekday overrides (0 = Sunday … 6 = Saturday), each of
//     which can mark the day `closed` or give it its own open/close window.
//   - `blackoutDates`: specific "YYYY-MM-DD" dates the service is unavailable.
//
// `hoursForDate` collapses all of that into one `{ open, close, closed }` answer,
// used by both the server (booking validation) and the client (slot generation).

export interface DaySchedule {
  day: number   // 0 = Sunday … 6 = Saturday
  open: string  // "HH:mm"
  close: string // "HH:mm"
  closed: boolean
}

const HHMM = /^\d{1,2}:\d{2}$/
const YMD = /^\d{4}-\d{2}-\d{2}$/

export interface ServiceHoursSource {
  openTime?: string
  closeTime?: string
  weeklyHours?: DaySchedule[]
  blackoutDates?: string[]
}

// Weekday (0 = Sun … 6 = Sat) of a "YYYY-MM-DD" string, computed in UTC so a
// date-only value always maps to the same weekday regardless of local timezone.
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function hoursForDate(svc: ServiceHoursSource, dateStr: string): { open: string; close: string; closed: boolean } {
  const fallback = { open: svc.openTime || '08:00', close: svc.closeTime || '20:00', closed: false }
  if (!dateStr) return fallback
  if ((svc.blackoutDates ?? []).includes(dateStr)) return { ...fallback, closed: true }
  const day = (svc.weeklyHours ?? []).find(h => h.day === weekdayOf(dateStr))
  if (!day) return fallback
  return { open: day.open, close: day.close, closed: !!day.closed }
}

// Coerce arbitrary request input into a clean weekly-hours array: one entry per
// weekday at most, valid HH:mm times, sorted.
export function sanitizeWeeklyHours(input: unknown): DaySchedule[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<number>()
  const out: DaySchedule[] = []
  for (const r of input) {
    if (!r || typeof r !== 'object') continue
    const row = r as Record<string, unknown>
    const day = Number(row.day)
    if (!Number.isInteger(day) || day < 0 || day > 6 || seen.has(day)) continue
    const open = typeof row.open === 'string' && HHMM.test(row.open) ? row.open : '08:00'
    const close = typeof row.close === 'string' && HHMM.test(row.close) ? row.close : '20:00'
    seen.add(day)
    out.push({ day, open, close, closed: Boolean(row.closed) })
  }
  return out.sort((a, b) => a.day - b.day)
}

// Coerce arbitrary input into a clean, unique, sorted list of "YYYY-MM-DD" dates.
export function sanitizeBlackoutDates(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return [...new Set(input.filter((d): d is string => typeof d === 'string' && YMD.test(d)))].sort()
}
