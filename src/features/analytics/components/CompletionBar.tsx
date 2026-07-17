interface CompletionBarProps {
  /** 0–100, or null when there is nothing to show. */
  percent: number | null
  label?: string
  color?: 'amber' | 'emerald' | 'sky'
}

const COLOR_GRADIENTS = {
  amber: 'from-amber-600 to-amber-400',
  emerald: 'from-emerald-600 to-emerald-400',
  sky: 'from-sky-600 to-sky-400',
} as const

/**
 * Percent-based bar for Analytics completion rates.
 * Distinct from `ProgressBar` (completed/total counts) — this takes a
 * precomputed 0–100 percent from the Engine presentation layer.
 */
export function CompletionBar({
  percent,
  label,
  color = 'amber',
}: CompletionBarProps) {
  const width = percent === null ? 0 : Math.min(100, Math.max(0, percent))

  return (
    <div
      className="h-2 overflow-hidden rounded-full border border-stone-700/50 bg-stone-950"
      role="progressbar"
      aria-valuenow={percent ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${COLOR_GRADIENTS[color]} transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
