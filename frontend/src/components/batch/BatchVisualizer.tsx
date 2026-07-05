import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BatchStatusName } from '@/lib/api'

const STATUS_ORDER: BatchStatusName[] = ['Open', 'Closed', 'Clearing', 'Cleared', 'Settled']

const STATUS_COLOR: Record<BatchStatusName, string> = {
  Open: 'var(--accent-yes)',
  Closed: 'var(--accent-data)',
  Clearing: 'var(--accent-data)',
  Cleared: 'var(--accent-data)',
  Settled: 'var(--text-subtle)',
}

export function BatchStatusPill({ status }: { status: BatchStatusName }) {
  const color = STATUS_COLOR[status]
  return (
    <span
      className="px-3 py-1 rounded-full font-mono text-xs uppercase tracking-wider"
      style={{ color, border: `1px solid ${color}`, background: 'transparent' }}
    >
      {status}
    </span>
  )
}

/** Live mm:ss countdown to the batch close time. */
export function BatchCountdown({ endTime }: { endTime: number | null }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(t)
  }, [])
  if (!endTime) return <>—</>
  const remaining = Math.max(0, endTime - now)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  return <>{remaining > 0 ? `${mm}:${ss}` : 'closing'}</>
}

/**
 * Sealed-slot grid — one locked cell per order in the batch. New orders animate in.
 * The whole point of the demo: the market sees slots FILL, never their contents.
 */
export function SealedSlots({ count, max = 24 }: { count: number; max?: number }) {
  const shown = Math.min(count, max)
  const cells = Array.from({ length: Math.max(shown, 8) })
  return (
    <div className="flex flex-wrap gap-1.5">
      <AnimatePresence>
        {cells.map((_, i) => {
          const filled = i < shown
          return (
            <motion.div
              key={i}
              initial={filled ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 24, delay: filled ? i * 0.02 : 0 }}
              className="h-6 w-6 rounded flex items-center justify-center text-[10px]"
              style={{
                background: filled ? 'var(--accent-data-dim)' : 'transparent',
                border: `1px solid ${filled ? 'var(--accent-data)' : 'var(--border)'}`,
                color: 'var(--accent-data)',
              }}
            >
              {filled ? '🔒' : ''}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/** Horizontal pipeline showing progress through the lifecycle. */
export function BatchPipeline({ status }: { status: BatchStatusName }) {
  const activeIdx = STATUS_ORDER.indexOf(status)
  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= activeIdx
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className="h-1.5 w-8 rounded-full transition-colors"
              style={{ background: done ? STATUS_COLOR[status] : 'var(--border)' }}
              title={s}
            />
          </div>
        )
      })}
    </div>
  )
}
