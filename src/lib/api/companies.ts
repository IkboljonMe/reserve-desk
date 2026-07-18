// A free-form key referencing Plan.key — see src/models/Plan.ts.
export type CompanyPlan = string

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

export interface CompanyAdminRecord {
  _id: string
  name: string
  email: string
  role: 'owner' | 'admin'
  hotelId: { _id: string; name: string; shortName: string } | null
  createdAt: string
}

export async function getCompanyAdmins(companyId: string): Promise<CompanyAdminRecord[]> {
  const res = await fetch(`/api/companies/${companyId}/admins`)
  if (!res.ok) throw new Error('Failed to fetch accounts')
  return res.json()
}

export async function resetCompanyAdminPassword(companyId: string, adminId: string, newPassword: string) {
  const res = await fetch(`/api/companies/${companyId}/admins/${adminId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to reset password')
  return data
}
