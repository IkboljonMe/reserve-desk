export interface ContractInput {
  organizationName: string
  inn: string
  representativeName: string
  phone: string
  contractNumber: string
  signDate: string
  finishDate: string
  status: 'awaiting' | 'signed' | 'terminated'
  contractLink: string
  notes: string
  reminderDays: number[]
}

export async function getContracts(search?: string, status?: string) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  const qs = params.toString()
  
  const res = await fetch(`/api/contracts${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch contracts')
  return res.json()
}

export async function createContract(data: ContractInput) {
  const res = await fetch('/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create contract')
  return res.json()
}

export async function updateContract(id: string, data: ContractInput) {
  const res = await fetch(`/api/contracts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update contract')
  return res.json()
}

export async function deleteContract(id: string) {
  const res = await fetch(`/api/contracts/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete contract')
  return res.json()
}
