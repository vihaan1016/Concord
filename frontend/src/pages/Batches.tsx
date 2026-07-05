import { Link } from 'react-router-dom'
import { useBatches } from '@/hooks/useBatches'
import { BatchPipeline, BatchStatusPill } from '@/components/batch/BatchVisualizer'
import { tickLabel } from '@/lib/ticks'

export default function Batches() {
  const { data: batches, isLoading } = useBatches()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-800 text-2xl text-text-primary mb-6">Batches</h1>

      {isLoading && <p className="font-mono text-sm text-text-muted">Loading…</p>}
      {!isLoading && (!batches || batches.length === 0) && (
        <p className="font-serif text-text-muted">No batches yet. Submit the first sealed order.</p>
      )}

      <div className="grid gap-3">
        {batches?.map((b) => (
          <Link
            key={b.batchId}
            to={`/batches/${b.batchId}`}
            className="rounded-lg border border-border bg-bg-surface p-5 hover:border-[var(--accent-data)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-700 text-text-primary">Batch #{b.batchId}</span>
              <BatchStatusPill status={b.status} />
            </div>
            <div className="mt-3">
              <BatchPipeline status={b.status} />
            </div>
            <div className="mt-4 flex gap-6 font-mono text-xs text-text-muted">
              <span>{b.orderCount} sealed</span>
              <span>
                clearing: {b.clearingTick != null ? tickLabel(b.clearingTick) : '—'}
              </span>
              <span>matched: {b.matchedVolume ?? '—'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
