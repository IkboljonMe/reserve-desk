export interface AdminHotel {
  _id: string
  name: string
  shortName: string
}

export interface AdminRecord {
  _id: string
  name: string
  email: string
  hotelId: AdminHotel | null
  createdAt: string
}

export async function getAdmins(): Promise<AdminRecord[]> {
  const res = await fetch('/api/admins')
  if (!res.ok) throw new Error('Failed to fetch admins')
  return res.json()
}

export interface AdminInput {
  name: string
  email: string
  password?: string
  hotelId: string
}

export async function saveAdmin(input: AdminInput, id?: string) {
  const res = await fetch(id ? `/api/admins/${id}` : '/api/admins', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to save admin')
  return data
}

export async function deleteAdmin(id: string) {
  const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete admin')
  return res.json()
}
