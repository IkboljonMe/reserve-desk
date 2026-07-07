'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ContractNotification } from '@/types'

export function useNotificationsQuery() {
  return useQuery<{ notifications: ContractNotification[]; count: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
  })
}

export function useDismissNotificationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ contractId, threshold }: { contractId: string; threshold: number }) => {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissReminder: threshold }),
      })
      if (!res.ok) throw new Error('Failed to dismiss reminder')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      window.dispatchEvent(new Event('notifications-updated'))
    },
  })
}
