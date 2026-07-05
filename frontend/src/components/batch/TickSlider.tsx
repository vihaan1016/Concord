import { Slider } from '@/components/ui/Slider'
import { MAX_TICK, MIN_TICK, tickLabel } from '@/lib/ticks'

/** Pick a limit price on the discrete 32-tick grid. Emits the tick index. */
export function TickSlider({ tick, onChange }: { tick: number; onChange: (tick: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Limit price</span>
        <span className="font-mono text-sm text-[var(--accent-data)]">
          {tickLabel(tick)} <span className="text-text-subtle">· tick {tick}</span>
        </span>
      </div>
      <Slider value={tick} min={MIN_TICK} max={MAX_TICK} step={1} onChange={(v) => onChange(Math.round(v))} />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-text-subtle">
        <span>{tickLabel(MIN_TICK)}</span>
        <span>{tickLabel(MAX_TICK)}</span>
      </div>
    </div>
  )
}
