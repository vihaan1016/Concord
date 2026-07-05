import { useParams } from 'react-router-dom'
import { useBatch } from '@/hooks/useBatches'
import { BatchPipeline, BatchStatusPill } from '@/components/batch/BatchVisualizer'
import { tickLabel } from '@/lib/ticks'

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: batch, isLoading } = useBatch(id)

  if (isLoading) return <Centered>Loading…</Centered>
  if (!batch) return <Centered>Batch not found.</Centered>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-800 text-2xl text-text-primary">Batch #{batch.batchId}</h1>
        <BatchStatusPill status={batch.status} />
      </div>
      <div className="mt-4">
        <BatchPipeline status={batch.status} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Field label="Orders" value={String(batch.orderCount)} />
        <Field
          label="Clearing price"
          value={batch.clearingTick != null ? tickLabel(batch.clearingTick) : '—'}
        />
        <Field label="Matched volume" value={batch.matchedVolume ?? '—'} />
      </div>

      <h2 className="mt-10 font-display font-700 text-lg text-text-primary">Sealed orders</h2>
      <p className="font-serif text-sm text-text-muted mb-4">
        Only the side and fill state are public. Price and size stay encrypted — visible to no one but
        the order’s owner.
      </p>

      <div className="grid gap-2">
        {batch.orders?.length === 0 && (
          <p className="font-mono text-sm text-text-subtle">No orders in this batch.</p>
        )}
        {batch.orders?.map((o) => (
          <div
            key={o.orderId}
            className="flex items-center justify-between rounded border border-border bg-bg-surface px-4 py-3 font-mono text-sm"
          >
            <span className="text-text-muted">#{o.orderId}</span>
            <span style={{ color: o.side === 'Buy' ? 'var(--accent-yes)' : 'var(--accent-no)' }}>
              {o.side}
            </span>
            <span className="text-text-subtle">price 🔒 · size 🔒</span>
            <span className="text-text-muted">{o.filled ? 'settled' : 'pending'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="text-xs font-mono uppercase tracking-wider text-text-subtle">{label}</div>
      <div className="mt-1 font-mono text-lg text-text-primary">{value}</div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto px-6 py-20 text-center font-mono text-text-muted">{children}</div>
}
