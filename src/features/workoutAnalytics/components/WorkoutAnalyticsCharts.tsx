import { TimeSeriesBarChart } from '@/features/analytics/components/TimeSeriesBarChart'
import { TimeSeriesLineChart } from '@/features/analytics/components/TimeSeriesLineChart'
import type { WorkoutAnalyticsChartBundle } from '@/features/workoutAnalytics/workoutAnalyticsChartSelectors'

interface WorkoutAnalyticsChartsProps {
  bundle: WorkoutAnalyticsChartBundle
}

/** Reuses the core Analytics chart infrastructure — no bespoke charting code. */
export function WorkoutAnalyticsCharts({ bundle }: WorkoutAnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TimeSeriesBarChart title="Workout Frequency" series={bundle.workoutFrequency} color="sky" />
      <TimeSeriesLineChart title="Duration Trend" series={bundle.durationTrend} color="amber" />
      <TimeSeriesLineChart title="Volume Trend" series={bundle.volumeTrend} color="emerald" />
      <TimeSeriesBarChart title="Top Exercises" series={bundle.exerciseFrequency} color="sky" />
      <TimeSeriesBarChart title="PR Timeline" series={bundle.prTimeline} color="amber" />
      <TimeSeriesBarChart
        title="Workout Consistency by Weekday"
        series={bundle.workoutConsistencyByWeekday}
        color="emerald"
      />
      <TimeSeriesBarChart
        title="Distribution — Muscle Region"
        series={bundle.distributionByMuscleRegion}
        color="sky"
      />
      <TimeSeriesBarChart
        title="Distribution — Training Type"
        series={bundle.distributionByTrainingType}
        color="emerald"
      />
      <TimeSeriesBarChart
        title="Distribution — Exercise Role"
        series={bundle.distributionByRole}
        color="amber"
      />
    </div>
  )
}
