export async function getHotels() {
  const res = await fetch('/api/hotels')
  if (!res.ok) throw new Error('Failed to fetch hotels')
  return res.json()
}
