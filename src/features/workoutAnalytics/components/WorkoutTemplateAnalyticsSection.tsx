import { useMemo } from 'react'

import { MetricGrid } from '@/features/analytics/components/MetricGrid'
import { StatisticCard } from '@/features/analytics/components/StatisticCard'
import { buildWorkoutTemplateStatRows } from '@/features/workoutAnalytics/workoutAnalyticsPresentation'
import { useWorkoutTemplateAnalyticsDetail } from '@/features/workoutAnalytics/workoutAnalyticsSelectors'
import type { WorkoutTemplateAnalyticsEntry } from '@/features/workoutAnalytics/workoutTemplateAnalyticsLogic'
import type { AnalyticsPeriod } from '@/types/analytics'

interface WorkoutTemplateAnalyticsSectionProps {
  period: AnalyticsPeriod
  entries: WorkoutTemplateAnalyticsEntry[]
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string) => void
}

export function WorkoutTemplateAnalyticsSection({
  period,
  entries,
  selectedTemplateId,
  onSelectTemplate,
}: WorkoutTemplateAnalyticsSectionProps) {
  const stats = useWorkoutTemplateAnalyticsDetail(selectedTemplateId, period)
  const statRows = useMemo(() => (stats ? buildWorkoutTemplateStatRows(stats) : []), [stats])

  if (entries.length === 0) {
    return <p className="text-xs text-stone-500">No workout templates recorded yet.</p>
  }

  return (
    <div className="space-y-3">
      <select
        value={selectedTemplateId ?? ''}
        onChange={(e) => onSelectTemplate(e.target.value)}
        className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-2 py-2 text-sm text-stone-200"
      >
        {entries.map((entry) => (
          <option key={entry.templateId} value={entry.templateId}>
            {entry.templateName}
            {entry.stats.timesCompleted > 0 ? ` (${entry.stats.timesCompleted})` : ''}
          </option>
        ))}
      </select>

      {stats && stats.timesCompleted === 0 ? (
        <p className="text-xs text-stone-500">
          No completions for this template in the selected period.
        </p>
      ) : (
        <MetricGrid columns={2}>
          {statRows.map((row) => (
            <StatisticCard key={row.id} label={row.label} value={row.value} hint={row.hint} />
          ))}
        </MetricGrid>
      )}
    </div>
  )
}
