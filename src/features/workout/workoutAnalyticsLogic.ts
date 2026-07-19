import { isDateInRange, resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import { computeActivitiesStatistics } from '@/features/workout/workoutStatistics'
import type { AnalyticsPeriod, WorkoutAnalytics } from '@/types/analytics'
import type { WorkoutActivity } from '@/types/workout'

function filterActivitiesForPeriod(
  activities: WorkoutActivity[],
  period: AnalyticsPeriod,
  input: AnalyticsInput,
): WorkoutActivity[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  if (!range) return activities
  return activities.filter((activity) =>
    isDateInRange(activity.heroDayKey, range),
  )
}

function periodDayCount(
  period: AnalyticsPeriod,
  input: AnalyticsInput,
): number | undefined {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  if (!range) return undefined

  const start = new Date(`${range.start}T12:00:00`)
  const end = new Date(`${range.end}T12:00:00`)
  const diffMs = end.getTime() - start.getTime()
  return Math.max(1, Math.round(diffMs / 86_400_000) + 1)
}

export function getWorkoutAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod = 'lifetime',
): WorkoutAnalytics {
  const activities = filterActivitiesForPeriod(
    input.workoutActivities,
    period,
    input,
  )

  const stats = computeActivitiesStatistics(activities, periodDayCount(period, input))

  return {
    workoutsCompleted: stats.workoutsCompleted,
    totalExercises: stats.exerciseCount,
    totalSets: stats.totalSets,
    totalReps: stats.totalReps,
    totalVolume: stats.totalVolume,
    totalDurationMinutes: stats.durationMinutes ?? 0,
    averageDurationMinutes: stats.averageDurationMinutes,
    workoutFrequencyPerWeek: stats.workoutFrequencyPerWeek,
  }
}
