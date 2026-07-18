export async function updateSuperadminAccount(input: { currentPassword: string; email: string; newPassword?: string }) {
  const res = await fetch('/api/superadmin/account', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to update account')
  return data as { email: string }
}
