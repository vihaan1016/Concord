import { motion } from 'framer-motion'
import { tickLabel } from '@/lib/ticks'

/** Prominent reveal of a cleared batch's uniform price + matched volume. */
export function ClearingResult({
  clearingTick,
  matchedVolume,
}: {
  clearingTick: number
  matchedVolume: string | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border p-6 text-center"
      style={{ borderColor: 'var(--accent-data)', background: 'var(--accent-data-dim)' }}
    >
      <div className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--accent-data)]">
        Uniform clearing price
      </div>
      <div className="mt-2 font-mono text-4xl text-text-primary">{tickLabel(clearingTick)}</div>
      <div className="mt-2 font-mono text-sm text-text-muted">
        matched volume {matchedVolume ?? '—'}
      </div>
    </motion.div>
  )
}
