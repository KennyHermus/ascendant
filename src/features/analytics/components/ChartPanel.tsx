import type { ReactNode } from 'react'

interface ChartPanelProps {
  title: string
  seriesLabel?: string
  pointCount: number
  children: ReactNode
}

export function ChartPanel({
  title,
  seriesLabel,
  pointCount,
  children,
}: ChartPanelProps) {
  return (
    <div className="rounded-lg border border-stone-700/40 bg-stone-950/40 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-300">
          {title}
        </h4>
        {seriesLabel && (
          <span className="text-[10px] text-stone-500">{seriesLabel}</span>
        )}
      </div>
      {pointCount === 0 ? (
        <p className="py-8 text-center text-xs text-stone-500">
          No finalized days in this period yet. Advance the quest day or choose
          a wider range.
        </p>
      ) : (
        children
      )}
    </div>
  )
}
