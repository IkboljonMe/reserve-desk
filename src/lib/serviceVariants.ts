import { randomUUID } from 'crypto'

type RawRow = { duration?: unknown; price?: unknown }
type RawGroup = { target?: unknown; category?: unknown; rows?: unknown }
type RawVariant = { id?: unknown; name?: unknown; pricingPlans?: unknown; pricingGroups?: unknown }

const numberRows = (rows: unknown) =>
  Array.isArray(rows)
    ? rows.map((r: RawRow) => ({ duration: Number(r?.duration) || 0, price: Number(r?.price) || 0 }))
    : []

const numberGroups = (groups: unknown) =>
  Array.isArray(groups)
    ? groups
        .filter((g: RawGroup) => g && (g.target === 'room' || g.target === 'client') && g.category)
        .map((g: RawGroup) => ({ target: g.target as 'room' | 'client', category: String(g.category), rows: numberRows(g.rows) }))
    : []

// Coerce and validate the variants array coming from the client: keep only
// named variants, ensure each has a stable id, and normalise all pricing numbers.
export function sanitizeVariants(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter((v: RawVariant) => v && typeof v.name === 'string' && v.name.trim())
    .map((v: RawVariant) => ({
      id: typeof v.id === 'string' && v.id ? v.id : randomUUID(),
      name: String(v.name).trim(),
      pricingPlans: numberRows(v.pricingPlans),
      pricingGroups: numberGroups(v.pricingGroups),
    }))
}
