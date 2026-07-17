import { TimeSeriesBarChart } from '@/features/analytics/components/TimeSeriesBarChart'
import { TimeSeriesLineChart } from '@/features/analytics/components/TimeSeriesLineChart'
import { useQuestChartBundle } from '@/features/questExplorer/questExplorerSelectors'

import type { AnalyticsPeriod } from '@/types/analytics'

interface QuestExplorerChartsProps {
  questId: string
  period: AnalyticsPeriod
  onDaySelect?: (date: string) => void
}

export function QuestExplorerCharts({
  questId,
  period,
  onDaySelect,
}: QuestExplorerChartsProps) {
  const bundle = useQuestChartBundle(questId, period)

  if (!bundle) return null

  const hasAttempts =
    bundle.completionTimeline.points.length > 0 ||
    bundle.completionVsMiss.missed.points.some((p) => p.value > 0)

  const hasRateTrend = bundle.completionRateTrend.points.length >= 2
  const hasTimeTrend = bundle.completionTimeTrend.points.length > 0
  const hasPunctuality =
    bundle.isTimed &&
    bundle.punctualityDistribution.points.some((p) => p.value > 0)

  if (!hasAttempts) {
    return (
      <p className="text-xs text-stone-500">
        No completion history for this quest in the selected period.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TimeSeriesBarChart
          title="Completed"
          series={bundle.completionVsMiss.completed}
          color="emerald"
          onDaySelect={onDaySelect}
        />
        {bundle.completionVsMiss.missed.points.some((p) => p.value > 0) && (
          <TimeSeriesBarChart
            title="Missed"
            series={bundle.completionVsMiss.missed}
            color="rose"
            onDaySelect={onDaySelect}
          />
        )}
      </div>

      {bundle.completionTimeline.points.length > 0 && (
        <TimeSeriesBarChart
          title="Completion Timeline"
          series={bundle.completionTimeline}
          color="sky"
          onDaySelect={onDaySelect}
        />
      )}

      {hasRateTrend && (
        <TimeSeriesLineChart
          title="Completion Rate Trend"
          series={bundle.completionRateTrend}
          color="emerald"
          valueMode="percent"
          yDomain={[0, 100]}
          onDaySelect={onDaySelect}
        />
      )}

      {hasTimeTrend && (
        <TimeSeriesLineChart
          title="Completion Time Trend"
          series={bundle.completionTimeTrend}
          color="amber"
          valueMode="timeOfDay"
          onDaySelect={onDaySelect}
        />
      )}

      {hasPunctuality && (
        <TimeSeriesBarChart
          title="Punctuality by Grade"
          series={bundle.punctualityDistribution}
          color="violet"
        />
      )}
    </div>
  )
}
