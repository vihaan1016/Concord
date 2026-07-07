import { useCallback, useState } from 'react'
import { useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { BASE_TOKEN_ADDRESS, QUOTE_TOKEN_ADDRESS, CONFIDENTIAL_TOKEN_ABI } from '@/config/contracts'

/** Mint test base + quote tokens to the connected trader (testnet faucet). */
export function useFaucet() {
  const { writeContractAsync } = useWriteContract()
  const config = useConfig()
  const [minting, setMinting] = useState(false)

  const mint = useCallback(
    async (to: `0x${string}`, amount: bigint) => {
      setMinting(true)
      try {
        for (const token of [BASE_TOKEN_ADDRESS, QUOTE_TOKEN_ADDRESS]) {
          const hash = await writeContractAsync({
            address: token,
            abi: CONFIDENTIAL_TOKEN_ABI,
            functionName: 'mint',
            args: [to, amount],
          })
          await waitForTransactionReceipt(config, { hash })
        }
      } finally {
        setMinting(false)
      }
    },
    [writeContractAsync, config],
  )

  return { mint, minting }
}
