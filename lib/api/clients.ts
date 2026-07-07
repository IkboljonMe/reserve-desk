export async function getClients(groupId?: string, search?: string) {
  const params = new URLSearchParams()
  if (groupId) params.set('groupId', groupId)
  if (search) params.set('search', search)
  const qs = params.toString()

  const res = await fetch(`/api/clients${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch clients')
  return res.json()
}
