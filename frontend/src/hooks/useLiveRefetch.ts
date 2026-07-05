import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from '@/lib/socket'

/**
 * Global socket listener — mount once (in Root). The indexer emits a lifecycle
 * event whenever a batch or order changes on-chain, after it has updated its
 * store. Invalidating here refetches at exactly the right moment.
 */
export function useLiveRefetch() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['currentBatch'] })
      queryClient.invalidateQueries({ queryKey: ['batch'] })
      queryClient.invalidateQueries({ queryKey: ['myOrders'] })
    }

    const events = ['batch:update', 'order:new', 'batch:cleared', 'order:filled', 'batch:settled']
    events.forEach((e) => socket.on(e, invalidateAll))
    return () => events.forEach((e) => socket.off(e, invalidateAll))
  }, [queryClient])
}
