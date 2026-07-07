'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBookings, createBooking, updateBooking, deleteBooking } from '@/lib/api/bookings'
import { Booking } from '@/types'

export function useBookingsQuery(dateFrom: string, dateTo: string) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', dateFrom, dateTo],
    queryFn: () => getBookings(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
  })
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useUpdateBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useDeleteBookingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}
