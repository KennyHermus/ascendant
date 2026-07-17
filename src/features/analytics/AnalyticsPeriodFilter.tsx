import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/types/analytics'
import { ANALYTICS_PERIOD_LABELS } from '@/features/analytics/analyticsPresentation'

interface AnalyticsPeriodFilterProps {
  value: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
}

/** Period control for the Analytics Dashboard — presentation only. */
export function AnalyticsPeriodFilter({
  value,
  onChange,
}: AnalyticsPeriodFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label="Analytics period"
    >
      {ANALYTICS_PERIODS.map((period) => {
        const selected = period === value
        return (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            aria-pressed={selected}
            className={`rounded-md border px-2.5 py-1 text-xs transition ${
              selected
                ? 'border-sky-600/60 bg-sky-950/50 text-sky-200'
                : 'border-stone-700/50 bg-stone-950/40 text-stone-400 hover:border-stone-600 hover:text-stone-300'
            }`}
          >
            {ANALYTICS_PERIOD_LABELS[period]}
          </button>
        )
      })}
    </div>
  )
}
