'use client'

import { useQuery } from '@tanstack/react-query'
import { getHotels } from '@/lib/api/hotels'
import { Hotel } from '@/types'

export function useHotelsQuery() {
  return useQuery<Hotel[]>({
    queryKey: ['hotels'],
    queryFn: getHotels,
  })
}
