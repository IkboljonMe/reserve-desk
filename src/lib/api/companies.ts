export type CompanyPlan = 'standard' | 'pro' | 'vip'

export interface CompanyRecord {
  _id: string
  name: string
  slug: string
  plan: CompanyPlan
  expiresAt: string
  contactName: string
  contactPhone: string
  paymentMethod: string
  createdAt: string
}

export async function getCompanies(): Promise<CompanyRecord[]> {
  const res = await fetch('/api/companies')
  if (!res.ok) throw new Error('Failed to fetch companies')
  return res.json()
}

export interface CompanyInput {
  name: string
  slug: string
  plan: CompanyPlan
  expiresAt: string
  contactName?: string
  contactPhone?: string
  paymentMethod?: string
  ownerName?: string
  ownerEmail?: string
  ownerPassword?: string
}

export async function saveCompany(input: CompanyInput, id?: string) {
  const res = await fetch(id ? `/api/companies/${id}` : '/api/companies', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to save company')
  return data
}

export async function deleteCompany(id: string) {
  const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to delete company')
  return data
}
