import { useMemo } from 'react'

import { MetricGrid } from '@/features/analytics/components/MetricGrid'
import { StatisticCard } from '@/features/analytics/components/StatisticCard'
import {
  formatOfficialPrSummary,
  formatPrHistorySummary,
} from '@/features/performance/prPresentation'
import { buildPrStatRows } from '@/features/workoutAnalytics/workoutAnalyticsPresentation'
import type { WorkoutPrAnalytics } from '@/features/workoutAnalytics/prAnalyticsLogic'

interface PrAnalyticsSectionProps {
  pr: WorkoutPrAnalytics
}

export function PrAnalyticsSection({ pr }: PrAnalyticsSectionProps) {
  const statRows = useMemo(() => buildPrStatRows(pr), [pr])

  return (
    <div className="space-y-4">
      <MetricGrid columns={2}>
        {statRows.map((row) => (
          <StatisticCard key={row.id} label={row.label} value={row.value} hint={row.hint} />
        ))}
      </MetricGrid>

      <div>
        <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Current Official PRs
        </h5>
        {pr.currentOfficialPrs.length === 0 ? (
          <p className="text-xs text-stone-500">No official PRs established yet.</p>
        ) : (
          <ul className="space-y-1">
            {pr.currentOfficialPrs.map((record) => (
              <li
                key={record.id}
                className="rounded-md border border-stone-700/40 bg-stone-950/40 px-2.5 py-1.5 text-xs text-stone-300"
              >
                {formatOfficialPrSummary(record)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Recent PRs (Period)
        </h5>
        {pr.recentPrs.length === 0 ? (
          <p className="text-xs text-stone-500">No PRs earned in the selected period.</p>
        ) : (
          <ul className="space-y-1">
            {pr.recentPrs.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-stone-700/40 bg-stone-950/40 px-2.5 py-1.5 text-xs text-stone-300"
              >
                {formatPrHistorySummary(entry)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Most Improved Exercises
        </h5>
        {pr.mostImprovedExercises.length === 0 ? (
          <p className="text-xs text-stone-500">Not enough PR history yet.</p>
        ) : (
          <ul className="space-y-1">
            {pr.mostImprovedExercises.map((entry) => (
              <li
                key={`${entry.exerciseId}-${entry.prType}`}
                className="rounded-md border border-stone-700/40 bg-stone-950/40 px-2.5 py-1.5 text-xs text-stone-300"
              >
                {entry.exerciseName} · +{entry.improvement}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
