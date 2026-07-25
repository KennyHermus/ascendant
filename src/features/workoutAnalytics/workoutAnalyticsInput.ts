import { isDateInRange, resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import type { AnalyticsDateRange, AnalyticsPeriod } from '@/types/analytics'
import type { CoachingState } from '@/types/progression'
import type { PerformanceState } from '@/types/performance'
import type { QuestDefinition } from '@/types/quest'
import type { WorkoutActivity } from '@/types/workout'

/**
 * Read-only inputs the Workout Analytics domain needs. Deliberately
 * separate from the generic `AnalyticsInput` — Workout Analytics is its own
 * domain and should not force every consumer of the core Analytics Engine
 * to grow workout-specific fields. Consumes existing state only; never
 * duplicates persisted data.
 */
export interface WorkoutAnalyticsInput {
  workoutActivities: WorkoutActivity[]
  performance: PerformanceState
  coaching: CoachingState
  questDefinitions: QuestDefinition[]
  now: Date
}

export function resolveWorkoutAnalyticsRange(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): AnalyticsDateRange {
  return resolvePeriodRange(period, input.questDefinitions, input.now)
}

export function filterActivitiesForPeriod(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): WorkoutActivity[] {
  const range = resolveWorkoutAnalyticsRange(input, period)
  return input.workoutActivities.filter((activity) =>
    isDateInRange(activity.heroDayKey, range),
  )
}

/** Number of inclusive calendar days spanned by a rolling period. */
export function periodDayCount(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): number {
  const range = resolveWorkoutAnalyticsRange(input, period)
  const start = new Date(`${range.start}T12:00:00`)
  const end = new Date(`${range.end}T12:00:00`)
  const diffMs = end.getTime() - start.getTime()
  return Math.max(1, Math.round(diffMs / 86_400_000) + 1)
}

/** Frequency per week helper shared by exercise / template / dashboard rollups. */
export function frequencyPerWeek(
  occurrences: number,
  days: number,
): number | null {
  if (days <= 0) return null
  return Math.round((occurrences / days) * 7 * 10) / 10
}
