import { getBenchmarkExerciseName } from '@/features/performance/exerciseFamilyLogic'
import { getPerformanceAnalytics } from '@/features/performance/performanceAnalyticsLogic'
import { resolveWorkoutAnalyticsRange, type WorkoutAnalyticsInput } from '@/features/workoutAnalytics/workoutAnalyticsInput'
import type { AnalyticsPeriod, PerformanceAnalytics } from '@/types/analytics'

export interface LongestStandingPr {
  exerciseId: string
  exerciseName: string
  achievedAt: string
  daysStanding: number
}

/**
 * Workout Analytics' PR view — reuses `getPerformanceAnalytics()` (the
 * existing PR data layer) and adds two derived, presentation-only rollups.
 * No PR data is recomputed or duplicated; only additional read-only
 * derivations are layered on top of `PerformanceState`.
 */
export interface WorkoutPrAnalytics extends PerformanceAnalytics {
  longestStandingPr: LongestStandingPr | null
  /** Official PRs earned per 30-day window over the resolved period. */
  prFrequencyPerMonth: number | null
}

function daysBetween(fromIso: string, now: Date): number {
  const diffMs = now.getTime() - new Date(fromIso).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function computeLongestStandingPr(
  input: WorkoutAnalyticsInput,
): LongestStandingPr | null {
  const records = input.performance.officialRecords
  if (records.length === 0) return null

  const oldest = [...records].sort((a, b) => a.achievedAt.localeCompare(b.achievedAt))[0]
  return {
    exerciseId: oldest.exerciseId,
    exerciseName: getBenchmarkExerciseName(oldest.exerciseId),
    achievedAt: oldest.achievedAt,
    daysStanding: daysBetween(oldest.achievedAt, input.now),
  }
}

function computePrFrequencyPerMonth(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
  totalPrsEarned: number,
): number | null {
  const range = resolveWorkoutAnalyticsRange(input, period)

  if (range) {
    const start = new Date(`${range.start}T12:00:00`)
    const end = new Date(`${range.end}T12:00:00`)
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1)
    return Math.round((totalPrsEarned / days) * 30 * 10) / 10
  }

  // Lifetime — normalize against history span rather than "all time / now".
  const history = input.performance.prHistory
  if (history.length === 0) return null
  const earliest = [...history].sort((a, b) => a.achievedAt.localeCompare(b.achievedAt))[0]
  const days = Math.max(1, daysBetween(earliest.achievedAt, input.now))
  return Math.round((history.length / days) * 30 * 10) / 10
}

export function getWorkoutPrAnalytics(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): WorkoutPrAnalytics {
  const base = getPerformanceAnalytics(
    { performance: input.performance, questDefinitions: input.questDefinitions, now: input.now },
    period,
  )

  return {
    ...base,
    longestStandingPr: computeLongestStandingPr(input),
    prFrequencyPerMonth: computePrFrequencyPerMonth(input, period, base.totalPrsEarned),
  }
}
