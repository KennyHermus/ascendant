import { CompletionBar } from '@/features/analytics/components/CompletionBar'
import type { DashboardAttemptRow } from '@/features/analytics/analyticsPresentation'

interface ProgressCardProps {
  row: DashboardAttemptRow
  color?: 'amber' | 'emerald' | 'sky'
}

/** Category / subcategory completion row — renders Engine presentation data. */
export function ProgressCard({ row, color = 'amber' }: ProgressCardProps) {
  return (
    <div className="rounded-lg border border-stone-700/40 bg-stone-950/40 px-3 py-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-stone-200">{row.label}</p>
        <p className="shrink-0 text-xs tabular-nums text-stone-400">
          {row.percentLabel}
        </p>
      </div>
      <CompletionBar percent={row.percent} label={row.label} color={color} />
      <p className="mt-1.5 text-[11px] text-stone-500">
        {row.completed} completed · {row.missed} missed
      </p>
    </div>
  )
}
