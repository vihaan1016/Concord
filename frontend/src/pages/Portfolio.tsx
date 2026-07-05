import { useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { Button } from '@/components/ui/Button'
import { useMyOrders } from '@/hooks/useBatches'
import { useUserDecrypt } from '@/hooks/useUserDecrypt'
import { DEX_ADDRESS, DEX_ABI } from '@/config/contracts'
import { tickLabel } from '@/lib/ticks'
import type { Order } from '@/lib/api'

export default function Portfolio() {
  const { address } = useAccount()
  const { data: orders, isLoading } = useMyOrders()

  if (!address) {
    return <Centered>Connect a wallet to see your sealed orders.</Centered>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-800 text-2xl text-text-primary mb-2">Portfolio</h1>
      <p className="font-serif text-sm text-text-muted mb-6">
        Your orders. Only you can decrypt their price and size — the proof the seal is real.
      </p>

      {isLoading && <p className="font-mono text-sm text-text-muted">Loading…</p>}
      {!isLoading && (!orders || orders.length === 0) && (
        <p className="font-serif text-text-muted">No orders yet.</p>
      )}

      <div className="grid gap-3">
        {orders?.map((o) => (
          <OrderRow key={o.orderId} order={o} />
        ))}
      </div>
    </div>
  )
}

function OrderRow({ order }: { order: Order }) {
  const publicClient = usePublicClient()
  const { decrypt, decrypting } = useUserDecrypt()
  const [revealed, setRevealed] = useState<{ tick: number; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reveal = async () => {
    setError(null)
    try {
      // Read the encrypted handles for this order from the DEX, then user-decrypt.
      const o = (await publicClient!.readContract({
        address: DEX_ADDRESS,
        abi: DEX_ABI,
        functionName: 'getOrder',
        args: [BigInt(order.orderId)],
      })) as { size: string; limitPrice: string }
      const tick = await decrypt(o.limitPrice)
      const size = await decrypt(o.size)
      setRevealed({ tick: Number(tick), size: Number(size) })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-text-muted">#{order.orderId}</span>
        <span style={{ color: order.side === 'Buy' ? 'var(--accent-yes)' : 'var(--accent-no)' }}>
          {order.side}
        </span>
        <span className="text-text-subtle">batch #{order.batchId}</span>
        <span className="text-text-muted">{order.filled ? 'settled' : 'pending'}</span>
      </div>

      <div className="mt-3 flex items-center gap-4">
        {revealed ? (
          <span className="font-mono text-sm text-text-primary">
            {tickLabel(revealed.tick)} · size {revealed.size}
          </span>
        ) : (
          <Button size="sm" variant="muted" onClick={reveal} loading={decrypting}>
            Decrypt my order
          </Button>
        )}
      </div>
      {error && <p className="mt-2 font-mono text-xs text-[var(--accent-no)]">{error}</p>}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center font-mono text-text-muted">{children}</div>
  )
}
