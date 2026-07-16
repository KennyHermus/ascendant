const COLOR_GRADIENTS = {
  amber: 'from-amber-600 to-amber-400',
  emerald: 'from-emerald-600 to-emerald-400',
  sky: 'from-sky-600 to-sky-400',
} as const

interface ProgressBarProps {
  completed: number
  total: number
  color?: keyof typeof COLOR_GRADIENTS
  label?: string
}

/**
 * Generic completed/total progress bar. Not quest-specific — reusable
 * anywhere a "N / M" fraction needs a visual bar (Today's Journey rows,
 * and any future system with the same shape of progress).
 */
export function ProgressBar({ completed, total, color = 'amber', label }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, (completed / total) * 100) : 0

  return (
    <div
      className="h-2.5 overflow-hidden rounded-full border border-stone-700/50 bg-stone-950"
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${COLOR_GRADIENTS[color]} transition-all duration-500`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
