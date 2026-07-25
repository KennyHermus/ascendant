import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { computeActivitiesStatistics } from '@/features/workout/workoutStatistics'
import {
  filterActivitiesForPeriod,
  periodDayCount,
  type WorkoutAnalyticsInput,
} from '@/features/workoutAnalytics/workoutAnalyticsInput'
import { addHeroDays } from '@/lib/timeService'
import type { AnalyticsPeriod } from '@/types/analytics'

export interface WorkoutDashboardOverview {
  currentTrainingStreak: number
  workoutsCompleted: number
  averageDurationMinutes: number | null
  totalDurationMinutes: number
  totalExercises: number
  totalSets: number
  totalReps: number
  totalVolume: number
  workoutFrequencyPerWeek: number | null
  completionRate: number | null
}

/** Consecutive Hero Days (ending today) with at least one workout activity — independent of the quest streak. */
export function getCurrentTrainingStreak(input: WorkoutAnalyticsInput): number {
  const days = new Set(input.workoutActivities.map((a) => a.heroDayKey))
  if (days.size === 0) return 0

  let streak = 0
  let cursor = getActiveQuestDayKey(input.questDefinitions, input.now)
  while (days.has(cursor)) {
    streak += 1
    cursor = addHeroDays(cursor, -1)
  }
  return streak
}

function aggregateCompletionRate(
  activities: WorkoutAnalyticsInput['workoutActivities'],
): number | null {
  let completed = 0
  let total = 0
  for (const activity of activities) {
    completed += activity.completedSetCount
    total += activity.setCount
  }
  return total > 0 ? completed / total : null
}

export function getWorkoutDashboardOverview(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): WorkoutDashboardOverview {
  const activities = filterActivitiesForPeriod(input, period)
  const stats = computeActivitiesStatistics(activities, periodDayCount(input, period))

  return {
    currentTrainingStreak: getCurrentTrainingStreak(input),
    workoutsCompleted: stats.workoutsCompleted,
    averageDurationMinutes: stats.averageDurationMinutes,
    totalDurationMinutes: stats.durationMinutes ?? 0,
    totalExercises: stats.exerciseCount,
    totalSets: stats.totalSets,
    totalReps: stats.totalReps,
    totalVolume: stats.totalVolume,
    workoutFrequencyPerWeek: stats.workoutFrequencyPerWeek,
    completionRate: aggregateCompletionRate(activities),
  }
}
