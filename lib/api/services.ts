export async function getServices() {
  const res = await fetch('/api/services')
  if (!res.ok) throw new Error('Failed to fetch services')
  return res.json()
}
