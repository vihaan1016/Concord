import { useCallback, useState } from 'react'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { DEX_ADDRESS, DEX_ABI, OrderType } from '@/config/contracts'
import { useEncryptOrder } from './useEncryptOrder'

export type SubmitStep = 'idle' | 'encrypting' | 'submitting' | 'confirmed' | 'error'

export interface SubmitParams {
  side: OrderType
  tick: number
  size: number
}

/** Encrypt (size, tick) client-side then submit the sealed order on-chain. */
export function useSubmitOrder() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { encryptOrder } = useEncryptOrder()
  const { writeContractAsync } = useWriteContract()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<SubmitStep>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const submit = useCallback(
    async ({ side, tick, size }: SubmitParams) => {
      if (!address) throw new Error('Connect a wallet first')
      setError(null)
      try {
        setStep('encrypting')
        const enc = await encryptOrder(address, tick, size)

        setStep('submitting')
        const hash = await writeContractAsync({
          address: DEX_ADDRESS,
          abi: DEX_ABI,
          functionName: 'submitOrder',
          args: [side, enc.sizeHandle, enc.tickHandle, enc.sizeProof, enc.tickProof],
        })
        setTxHash(hash)
        await publicClient?.waitForTransactionReceipt({ hash })

        setStep('confirmed')
        queryClient.invalidateQueries({ queryKey: ['currentBatch'] })
        queryClient.invalidateQueries({ queryKey: ['myOrders'] })
        return hash
      } catch (e) {
        setError(e as Error)
        setStep('error')
        throw e
      }
    },
    [address, encryptOrder, writeContractAsync, publicClient, queryClient],
  )

  const reset = useCallback(() => {
    setStep('idle')
    setError(null)
    setTxHash(undefined)
  }, [])

  return { submit, step, error, txHash, reset }
}
