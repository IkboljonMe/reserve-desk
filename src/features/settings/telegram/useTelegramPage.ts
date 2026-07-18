'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import {
  getTelegramStatus, disconnectTelegram, syncTelegramTopics, setTopicNotifications,
  type TelegramStatus,
} from '@/lib/api/telegram'

export function useTelegramPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnectConfirm, setDisconnectConfirm] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      setStatus(await getTelegramStatus())
    } catch {
      showToast(t('loadTelegramStatusFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, t])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await disconnectTelegram()
      showToast(t('telegramDisconnected'), 'success')
      setDisconnectConfirm(false)
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('telegramDisconnectFailed'), 'error')
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await syncTelegramTopics()
      showToast(t('telegramSynced'), 'success')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('telegramSyncFailed'), 'error')
    } finally {
      setSyncing(false)
    }
  }

  async function handleToggleTopic(id: string, kind: 'booking' | 'menu', enabled: boolean) {
    setTogglingId(id)
    // Optimistic update so the switch feels immediate.
    setStatus(prev => prev && {
      ...prev,
      topics: prev.topics.map(t => t.id === id ? { ...t, notificationsEnabled: enabled } : t),
    })
    try {
      await setTopicNotifications(id, kind, enabled)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('telegramTopicUpdateFailed'), 'error')
      loadData()
    } finally {
      setTogglingId(null)
    }
  }

  return {
    status, loading, disconnecting, syncing, disconnectConfirm, setDisconnectConfirm,
    togglingId, handleDisconnect, handleSync, handleToggleTopic,
  }
}

export type TelegramPageState = ReturnType<typeof useTelegramPage>
