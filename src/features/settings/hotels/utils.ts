export const SHORT_NAME_RE = /^[A-Z0-9]{2,6}$/

// Build a suggested compact code from a full hotel name: initials of the first
// few significant words. "Fergana Grand Hotel" -> "FG" (skips "Hotel").
export function suggestShortName(fullName: string): string {
  const stop = new Set(['hotel', 'the', 'and', 'of', 'resort', 'inn'])
  const words = fullName
    .split(/\s+/)
    .map(w => w.replace(/[^A-Za-z0-9]/g, ''))
    .filter(w => w && !stop.has(w.toLowerCase()))
  const letters = words.map(w => w[0]).join('').toUpperCase()
  return letters.slice(0, 4)
}

// A code that's always safe to display: the stored shortName, or one derived
// from the name for legacy hotels that predate the shortName field.
export function displayCode(hotel: { shortName?: string; name: string }): string {
  if (hotel.shortName) return hotel.shortName
  const suggested = suggestShortName(hotel.name)
  if (suggested.length >= 2) return suggested
  return hotel.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'HTL'
}
