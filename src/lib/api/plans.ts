import type { FeatureKey } from '@/lib/planFeatures'

export interface PlanRecord {
  _id: string
  key: string
  name: string
  features: FeatureKey[]
  price: number
  description: string
  highlight: boolean
  sortOrder: number
  createdAt: string
}

export async function getPlans(): Promise<PlanRecord[]> {
  const res = await fetch('/api/plans')
  if (!res.ok) throw new Error('Failed to fetch plans')
  return res.json()
}

export interface PlanInput {
  key?: string
  name: string
  features: FeatureKey[]
  price: number
  description: string
  highlight: boolean
}

export async function savePlan(input: PlanInput, id?: string) {
  const res = await fetch(id ? `/api/plans/${id}` : '/api/plans', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to save plan')
  return data
}

export async function deletePlan(id: string) {
  const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to delete plan')
  return data
}
