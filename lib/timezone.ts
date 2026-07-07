/**
 * Timezone helpers — hardcoded to Uzbekistan (Asia/Tashkent, UTC+5).
 *
 * All "current time" calls across the app should use `nowUZ()` so that
 * dates shown to the admin (today's date, week ranges, etc.) are always
 * correct for Uzbekistan regardless of where the server is hosted.
 */

export const TZ = 'Asia/Tashkent'

/**
 * Returns a Date object whose local methods (.getFullYear, .getMonth, …)
 * reflect the current wall-clock time in Uzbekistan.
 *
 * Implementation: take UTC now and shift it by the Uzbekistan fixed offset
 * (+5 h). We don't use Intl tricks that produce string-only results because
 * date-fns functions (startOfWeek, format, etc.) need a real Date object.
 */
export function nowUZ(): Date {
  const UZ_OFFSET_MS = 5 * 60 * 60 * 1000 // UTC+5
  const utcMs = Date.now()
  // Create a Date whose "local" time mirrors Uzbekistan wall time.
  // We achieve this by constructing a UTC-based timestamp that, when read
  // with UTC methods, matches the Uzbekistan clock.
  return new Date(utcMs + UZ_OFFSET_MS)
}

/**
 * Format a Date (or ISO string) for display to the user in the
 * Uzbekistan locale using Intl.DateTimeFormat.
 */
export function formatUZ(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ru-UZ', { ...options, timeZone: TZ }).format(d)
}
