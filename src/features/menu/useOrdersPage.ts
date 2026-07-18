'use client'

import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { getHotels } from '@/lib/api/hotels'
import { getOrders, updateOrderStatus } from '@/lib/api/menu'
import type { MenuOrder, MenuHotel, OrderStatus } from './types'

export function useOrdersPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const qc = useQueryClient()

  const [hotelId, setHotelId] = useState('')
  const [status, setStatus] = useState('')

  const hotelsQuery = useQuery<MenuHotel[]>({ queryKey: ['hotels'], queryFn: getHotels })
  const hotels = hotelsQuery.data ?? []

  const ordersKey = ['menu', 'orders', hotelId, status] as const
  const ordersQuery = useQuery<MenuOrder[]>({
    queryKey: ordersKey,
    queryFn: () => getOrders({ hotelId: hotelId || undefined, status: status || undefined }),
    // Staff see new/updated orders without a manual refresh.
    refetchInterval: 15000,
  })
  const orders = ordersQuery.data ?? []
  const loading = ordersQuery.isLoading

  const statusMut = useMutation({
    mutationFn: (vars: { orderId: string; status: OrderStatus }) => updateOrderStatus(vars.orderId, vars.status),
    onMutate: async vars => {
      await qc.cancelQueries({ queryKey: ordersKey })
      const previous = qc.getQueryData<MenuOrder[]>(ordersKey)
      qc.setQueryData<MenuOrder[]>(ordersKey, prev =>
        prev?.map(o => (o._id === vars.orderId ? { ...o, status: vars.status } : o)))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(ordersKey, context.previous)
      showToast(t('updateFailed'), 'error')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ordersKey }),
  })

  const setStatusFor = (orderId: string, next: OrderStatus) => {
    statusMut.mutate({ orderId, status: next })
  }

  return {
    hotels, hotelId, setHotelId, status, setStatus, orders, loading,
    reload: () => ordersQuery.refetch(),
    setStatusFor,
  }
}

export type OrdersPageState = ReturnType<typeof useOrdersPage>
