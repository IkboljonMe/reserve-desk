'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContracts, createContract, updateContract, deleteContract } from '@/lib/api/contracts'
import { Contract } from '@/types'

export function useContractsQuery(search?: string, status?: string) {
  return useQuery<Contract[]>({
    queryKey: ['contracts', search, status],
    queryFn: () => getContracts(search, status),
  })
}

export function useCreateContractMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUpdateContractMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDeleteContractMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
