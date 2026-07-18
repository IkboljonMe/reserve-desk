export interface TelegramTopicSummary {
  id: string
  kind: 'booking' | 'menu'
  hotelName: string
  serviceName?: string
  notificationsEnabled: boolean
}

export interface TelegramStatus {
  connected: boolean
  groupChatId?: number
  loggedInByName?: string
  loggedInByEmail?: string
  connectedAt?: string
  botUsername: string | null
  topics: TelegramTopicSummary[]
}

export async function getTelegramStatus(): Promise<TelegramStatus> {
  const res = await fetch('/api/telegram/status')
  if (!res.ok) throw new Error('Failed to load Telegram status')
  return res.json()
}

export async function disconnectTelegram() {
  const res = await fetch('/api/telegram/disconnect', { method: 'POST' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to disconnect')
  return data
}

export async function syncTelegramTopics() {
  const res = await fetch('/api/telegram/sync', { method: 'POST' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to sync topics')
  return data
}

export async function setTopicNotifications(id: string, kind: 'booking' | 'menu', notificationsEnabled: boolean) {
  const res = await fetch(`/api/telegram/topics/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, notificationsEnabled }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Failed to update topic')
  return data
}
