'use client'

import { useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { ContractNotification } from '@/types'
import { useNotificationsQuery, useDismissNotificationMutation } from '@/hooks/useNotifications'
import { TIER_ORDER } from './constants'

export function useNotificationsPage() {
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [dismissing, setDismissing] = useState<string | null>(null)

  const { data, isLoading: loading, refetch } = useNotificationsQuery()
  const items = data?.notifications || []

  const dismissMutation = useDismissNotificationMutation()

  async function dismiss(n: ContractNotification) {
    setDismissing(n.contractId + ':' + n.threshold)
    try {
      await dismissMutation.mutateAsync({ contractId: n.contractId, threshold: n.threshold })
      // Let the sidebar badge refresh.
      window.dispatchEvent(new Event('notifications-updated'))
      showToast(t('reminderDismissed'), 'success')
    } catch {
      showToast(t('dismissFailed'), 'error')
    } finally {
      setDismissing(null)
    }
  }

  const grouped = TIER_ORDER
    .map(tier => ({ tier, list: items.filter(i => i.tier === tier) }))
    .filter(g => g.list.length > 0)

  return { items, loading, refetch, dismissing, dismiss, grouped }
}

export type NotificationsPageState = ReturnType<typeof useNotificationsPage>
