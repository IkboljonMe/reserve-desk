import type { FeatureKey } from '@/lib/planFeatures'
import type { BillingCycle, OfferingUnit } from '@/lib/offerings'

export type OrderStatus = 'draft' | 'accepted' | 'provisioned' | 'cancelled'

export interface OrderLine {
  offeringKey: string
  label: string
  unit: OfferingUnit
  feature: FeatureKey
  unitPrice: number
  quantity: number
}

export interface OrderRecord {
  _id: string
  businessName: string
  contactName: string
  contactPhone: string
  lines: OrderLine[]
  monthlySubtotal: number
  billingCycle: BillingCycle
  discountPercent: number
  total: number
  paymentMethod: string
  paymentDate: string | null
  status: OrderStatus
  companyId: string | null
  note: string
  createdAt: string
  updatedAt: string
}

// What the builder sends. Totals are recomputed server-side, so they're omitted.
export interface OrderLineInput {
  offeringKey: string
  unitPrice: number
  quantity: number
}

export interface OrderInput {
  businessName: string
  contactName?: string
  contactPhone?: string
  lines: OrderLineInput[]
  billingCycle: BillingCycle
  discountPercent: number
  paymentMethod?: string
  paymentDate?: string | null
  note?: string
  status?: OrderStatus
}

export async function getOrders(): Promise<OrderRecord[]> {
  const res = await fetch('/api/orders')
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export async function saveOrder(input: OrderInput, id?: string) {
  const res = await fetch(id ? `/api/orders/${id}` : '/api/orders', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to save order')
  return data
}

export async function deleteOrder(id: string) {
  const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to delete order')
  return data
}

// Turn an order into a live business (Company + owner login).
export async function provisionOrder(id: string, ownerEmail: string, ownerPassword: string) {
  const res = await fetch(`/api/orders/${id}/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerEmail, ownerPassword }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to provision business')
  return data
}
