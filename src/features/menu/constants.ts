import type { DictionaryKeys } from '@/i18n'
import type { OrderStatus } from './types'

// Per-status display metadata for order badges (labelKey resolves via t()).
export const ORDER_STATUS_META: Record<OrderStatus, { labelKey: DictionaryKeys; color: string; bg: string }> = {
  pending: { labelKey: 'orderPending', color: '#b45309', bg: 'rgba(245,158,11,0.15)' },
  preparing: { labelKey: 'orderPreparing', color: '#2563eb', bg: 'rgba(37,99,235,0.13)' },
  ready: { labelKey: 'orderReady', color: '#0f9d58', bg: 'rgba(16,185,129,0.15)' },
  delivered: { labelKey: 'orderDelivered', color: '#6b7280', bg: 'rgba(107,114,128,0.13)' },
  cancelled: { labelKey: 'orderCancelled', color: '#dc2626', bg: 'rgba(239,68,68,0.13)' },
}

// The forward status flow (also drives the guest order-tracker steps).
// `nextStatus` returns the button target, or null when finished/cancelled.
export const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered']

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status)
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null
}

// Label for the "advance" action button per current status.
export const ADVANCE_LABEL_KEY: Partial<Record<OrderStatus, DictionaryKeys>> = {
  pending: 'orderStartPreparing',
  preparing: 'orderMarkReady',
  ready: 'orderMarkDelivered',
}
