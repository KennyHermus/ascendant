import { EXERCISE_BY_ID, EXERCISE_DEFINITIONS } from '@/data/exercises'
import { getFamilyForExercise } from '@/features/performance/exerciseFamilyLogic'
import { getRecommendationsForExercise } from '@/features/progression/progressionEngineLogic'
import { computeSetVolume } from '@/features/workout/workoutStatistics'
import {
  filterActivitiesForPeriod,
  frequencyPerWeek,
  periodDayCount,
  type WorkoutAnalyticsInput,
} from '@/features/workoutAnalytics/workoutAnalyticsInput'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { CoachingRecommendation } from '@/types/progression'
import type { OfficialPersonalRecord } from '@/types/performance'
import type { ExerciseDefinition, ExerciseSetLog, WorkoutActivity } from '@/types/workout'

export const EXERCISE_TRENDS = ['improving', 'declining', 'stable', 'insufficient_data'] as const
export type ExerciseTrend = (typeof EXERCISE_TRENDS)[number]

export interface ExerciseBestSession {
  activityId: string
  heroDayKey: string
  completedAt: string
  display: string
}

export interface ExerciseAnalyticsStats {
  exerciseId: string
  timesPerformed: number
  totalSets: number
  totalReps: number
  averageWeight: number | null
  averageReps: number | null
  averageDurationSeconds: number | null
  averageVolume: number | null
  recentTrend: ExerciseTrend
  bestSession: ExerciseBestSession | null
  officialPr: OfficialPersonalRecord | null
  trainingFrequencyPerWeek: number | null
  lastPerformedAt: string | null
  currentRecommendation: CoachingRecommendation | null
}

export interface ExerciseAnalyticsEntry {
  exercise: ExerciseDefinition
  familyId: string | null
  familyName: string | null
  stats: ExerciseAnalyticsStats
}

function exerciseOccurrences(
  activity: WorkoutActivity,
  exerciseId: string,
): { sets: ExerciseSetLog[] }[] {
  return activity.exercises
    .filter((entry) => entry.exerciseId === exerciseId)
    .map((entry) => ({ sets: entry.sets.filter((set) => set.completed) }))
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Primary numeric metric used to rank/trend one session's performance. */
function primarySessionValue(exercise: ExerciseDefinition, sets: ExerciseSetLog[]): number {
  const units = exercise.defaultUnits
  if (units.includes('weight') && units.includes('reps')) {
    return Math.max(0, ...sets.map((s) => computeSetVolume(s)), 0)
  }
  if (units.includes('durationSeconds')) {
    return Math.max(0, ...sets.map((s) => s.fields.durationSeconds ?? 0), 0)
  }
  if (units.includes('distance')) {
    return Math.max(0, ...sets.map((s) => s.fields.distance ?? 0), 0)
  }
  return Math.max(0, ...sets.map((s) => s.fields.reps ?? 0), 0)
}

function formatSessionValue(exercise: ExerciseDefinition, sets: ExerciseSetLog[]): string {
  const units = exercise.defaultUnits
  const bestSet = [...sets].sort(
    (a, b) => primarySessionValue(exercise, [b]) - primarySessionValue(exercise, [a]),
  )[0]
  if (!bestSet) return '—'

  if (units.includes('weight') && units.includes('reps')) {
    const weight = bestSet.fields.weight ?? 0
    const reps = bestSet.fields.reps ?? 0
    return `${weight} lb × ${reps}`
  }
  if (units.includes('durationSeconds')) {
    const seconds = Math.max(0, ...sets.map((s) => s.fields.durationSeconds ?? 0))
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }
  if (units.includes('distance')) {
    const distance = Math.max(0, ...sets.map((s) => s.fields.distance ?? 0))
    return `${distance} m`
  }
  const reps = Math.max(0, ...sets.map((s) => s.fields.reps ?? 0))
  return `${reps} reps`
}

function computeTrend(sessionValues: number[]): ExerciseTrend {
  if (sessionValues.length < 3) return 'insufficient_data'
  const half = Math.floor(sessionValues.length / 2)
  const earlierAvg = mean(sessionValues.slice(0, half))
  const laterAvg = mean(sessionValues.slice(sessionValues.length - half))
  if (earlierAvg == null || laterAvg == null) return 'insufficient_data'
  if (earlierAvg === 0 && laterAvg === 0) return 'stable'
  if (laterAvg > earlierAvg * 1.05) return 'improving'
  if (laterAvg < earlierAvg * 0.95) return 'declining'
  return 'stable'
}

export function getExerciseAnalytics(
  input: WorkoutAnalyticsInput,
  exerciseId: string,
  period: AnalyticsPeriod,
): ExerciseAnalyticsStats {
  const exercise = EXERCISE_BY_ID.get(exerciseId)
  const activities = filterActivitiesForPeriod(input, period)
    .filter((activity) => activity.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))

  const weights: number[] = []
  const reps: number[] = []
  const durations: number[] = []
  const sessionVolumes: number[] = []
  const sessionValues: number[] = []
  let totalSets = 0
  let totalReps = 0
  let bestSession: ExerciseBestSession | null = null
  let bestValue = -Infinity

  for (const activity of activities) {
    const occurrences = exerciseOccurrences(activity, exerciseId)
    const allSets = occurrences.flatMap((o) => o.sets)
    if (allSets.length === 0) continue

    totalSets += allSets.length
    let sessionVolume = 0
    for (const set of allSets) {
      const weight = set.fields.weight
      const setReps = set.fields.reps
      const duration = set.fields.durationSeconds
      if (weight != null && weight > 0) weights.push(weight)
      if (setReps != null && setReps > 0) {
        reps.push(setReps)
        totalReps += setReps
      }
      if (duration != null && duration > 0) durations.push(duration)
      sessionVolume += computeSetVolume(set)
    }
    if (sessionVolume > 0) sessionVolumes.push(sessionVolume)

    if (exercise) {
      const value = primarySessionValue(exercise, allSets)
      sessionValues.push(value)
      if (value > bestValue) {
        bestValue = value
        bestSession = {
          activityId: activity.id,
          heroDayKey: activity.heroDayKey,
          completedAt: activity.completedAt,
          display: formatSessionValue(exercise, allSets),
        }
      }
    }
  }

  const days = periodDayCount(input, period)
  const officialPr =
    input.performance.officialRecords.find((r) => r.exerciseId === exerciseId) ?? null
  const recommendations = getRecommendationsForExercise(
    input.coaching.activeRecommendations,
    exerciseId,
  )

  return {
    exerciseId,
    timesPerformed: activities.length,
    totalSets,
    totalReps,
    averageWeight: mean(weights),
    averageReps: mean(reps),
    averageDurationSeconds: mean(durations),
    averageVolume: mean(sessionVolumes),
    recentTrend: computeTrend(sessionValues),
    bestSession,
    officialPr,
    trainingFrequencyPerWeek: frequencyPerWeek(activities.length, days),
    lastPerformedAt: activities.length > 0 ? activities[activities.length - 1].completedAt : null,
    currentRecommendation: recommendations[0] ?? null,
  }
}

export function getAllExerciseAnalyticsEntries(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): ExerciseAnalyticsEntry[] {
  return EXERCISE_DEFINITIONS.map((exercise) => {
    const family = getFamilyForExercise(exercise.id)
    return {
      exercise,
      familyId: family?.id ?? null,
      familyName: family?.name ?? null,
      stats: getExerciseAnalytics(input, exercise.id, period),
    }
  })
}

/** Only exercises with training history in the period, most-performed first. */
export function getPracticedExerciseAnalyticsEntries(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): ExerciseAnalyticsEntry[] {
  return getAllExerciseAnalyticsEntries(input, period)
    .filter((entry) => entry.stats.timesPerformed > 0)
    .sort((a, b) => b.stats.timesPerformed - a.stats.timesPerformed)
}

export function searchExerciseAnalyticsEntries(
  entries: ExerciseAnalyticsEntry[],
  query: string,
): ExerciseAnalyticsEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (entry) =>
      entry.exercise.name.toLowerCase().includes(q) ||
      entry.exercise.id.toLowerCase().includes(q) ||
      (entry.familyName?.toLowerCase().includes(q) ?? false),
  )
}
