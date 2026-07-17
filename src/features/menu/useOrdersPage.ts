'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import { useTranslation } from '@/i18n'
import { getHotels } from '@/lib/api/hotels'
import { getOrders, updateOrderStatus } from '@/lib/api/menu'
import type { MenuOrder, MenuHotel, OrderStatus } from './types'

export function useOrdersPage() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [hotels, setHotels] = useState<MenuHotel[]>([])
  const [hotelId, setHotelId] = useState('')
  const [status, setStatus] = useState('')
  const [orders, setOrders] = useState<MenuOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHotels().then((hs: MenuHotel[]) => setHotels(hs)).catch(() => {})
  }, [])

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    getOrders({ hotelId: hotelId || undefined, status: status || undefined })
      .then(setOrders)
      .catch(() => { if (!silent) showToast(t('menuLoadFailed'), 'error') })
      .finally(() => setLoading(false))
  }, [hotelId, status, showToast, t])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data load
  useEffect(() => { load() }, [load])

  // Poll for new / updated orders so staff see them without a manual refresh.
  useEffect(() => {
    const id = setInterval(() => load(true), 15000)
    return () => clearInterval(id)
  }, [load])

  const setStatusFor = async (orderId: string, next: OrderStatus) => {
    setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status: next } : o)))
    try {
      await updateOrderStatus(orderId, next)
    } catch {
      showToast(t('updateFailed'), 'error')
      load(true)
    }
  }

  return { hotels, hotelId, setHotelId, status, setStatus, orders, loading, reload: () => load(), setStatusFor }
}

export type OrdersPageState = ReturnType<typeof useOrdersPage>
