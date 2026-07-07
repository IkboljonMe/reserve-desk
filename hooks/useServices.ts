'use client'

import { useQuery } from '@tanstack/react-query'
import { getServices } from '@/lib/api/services'
import { Service } from '@/types'

export function useServicesQuery() {
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: getServices,
  })
}
