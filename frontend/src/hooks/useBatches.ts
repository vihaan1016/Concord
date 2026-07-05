import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { api } from '@/lib/api'

export function useBatches() {
  return useQuery({ queryKey: ['batches'], queryFn: api.getBatches, refetchInterval: 15_000 })
}

export function useCurrentBatch() {
  return useQuery({
    queryKey: ['currentBatch'],
    queryFn: api.getCurrentBatch,
    retry: false,
    refetchInterval: 10_000,
  })
}

export function useBatch(id: string | undefined) {
  return useQuery({
    queryKey: ['batch', id],
    queryFn: () => api.getBatch(id!),
    enabled: !!id,
  })
}

export function useMyOrders() {
  const { address } = useAccount()
  return useQuery({
    queryKey: ['myOrders', address],
    queryFn: () => api.getMyOrders(address!),
    enabled: !!address,
  })
}
