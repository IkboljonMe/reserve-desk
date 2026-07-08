export type ViewMode = 'day' | 'week' | 'month'
export type StatusFilter = 'all' | 'unpaid' | 'paid' | 'finished'

export const ROW_HEIGHTS = { Compact: 48, Cozy: 64, Roomy: 88 } as const
export type Density = keyof typeof ROW_HEIGHTS
