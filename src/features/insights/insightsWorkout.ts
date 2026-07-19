import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import { getWorkoutAnalytics } from '@/features/workout/workoutAnalyticsLogic'
import { formatWorkoutVolume } from '@/features/workout/workoutPresentation'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { Insight } from '@/types/insights'

export function generateWorkoutInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const stats = getWorkoutAnalytics(input, period)
  if (stats.workoutsCompleted === 0) return []

  const duration =
    stats.averageDurationMinutes != null
      ? `${stats.averageDurationMinutes} min avg`
      : 'duration not tracked'

  const insights: Insight[] = [
    {
      id: `workout-volume-${period}`,
      type: 'workoutVolume',
      category: 'quest',
      title: 'Workout volume',
      explanation: `${stats.workoutsCompleted} workout${stats.workoutsCompleted === 1 ? '' : 's'} logged in this period.`,
      metric: {
        label: 'Exercises / sets',
        value: `${stats.totalExercises} / ${stats.totalSets}`,
      },
      severity: 'neutral',
      subject: duration,
    },
  ]

  if (stats.totalVolume > 0) {
    insights.push({
      id: `workout-load-${period}`,
      type: 'workoutVolume',
      category: 'quest',
      title: 'Training load',
      explanation: `Total volume reached ${formatWorkoutVolume(stats.totalVolume)} across ${stats.totalReps} reps.`,
      metric: {
        label: 'Frequency',
        value:
          stats.workoutFrequencyPerWeek != null
            ? `${stats.workoutFrequencyPerWeek}/week`
            : '—',
      },
      severity: 'positive',
    })
  }

  return insights
}
