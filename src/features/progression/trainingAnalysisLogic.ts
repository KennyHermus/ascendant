import type { WorkoutActivity } from '@/types/workout'

/** Minimum completed workouts before load/volume recommendations apply. */
export const MIN_WORKOUTS_FOR_TREND = 3

/** Lookback window for trend analysis. */
export const TREND_WORKOUT_LOOKBACK = 6

export interface ExerciseSetPerformance {
  plannedReps: number | null
  plannedWeight: number | null
  actualReps: number | null
  actualWeight: number | null
  exceededPlannedReps: boolean
  belowPlannedReps: boolean
  exceededPlannedWeight: boolean
}

export interface ExerciseWorkoutSnapshot {
  activityId: string
  completedAt: string
  heroDayKey: string
  setPerformances: ExerciseSetPerformance[]
  totalReps: number
  maxRepsInSet: number
  maxWeight: number
  avgActualReps: number | null
  avgPlannedReps: number | null
  setsExceededReps: number
  setsBelowReps: number
  setsWithPlannedReps: number
}

export interface ExerciseTrainingTrend {
  exerciseId: string
  snapshots: ExerciseWorkoutSnapshot[]
  workoutCount: number
  consecutiveExceededReps: number
  consecutiveBelowReps: number
  exceededRepsWorkoutCount: number
  belowRepsWorkoutCount: number
  avgFrequencyDays: number | null
}

function extractSetPerformance(set: import('@/types/workout').ExerciseSetLog): ExerciseSetPerformance | null {
  if (!set.completed) return null

  const plannedReps = set.target?.plannedReps ?? null
  const plannedWeight = set.target?.plannedWeight ?? null
  const actualReps = set.fields.reps ?? null
  const actualWeight = set.fields.weight ?? null

  const exceededPlannedReps =
    plannedReps != null && actualReps != null && actualReps > plannedReps
  const belowPlannedReps =
    plannedReps != null && actualReps != null && actualReps < plannedReps * 0.75
  const exceededPlannedWeight =
    plannedWeight != null &&
    actualWeight != null &&
    actualWeight > plannedWeight

  return {
    plannedReps,
    plannedWeight,
    actualReps,
    actualWeight,
    exceededPlannedReps,
    belowPlannedReps,
    exceededPlannedWeight,
  }
}

export function extractExerciseSnapshot(
  activity: WorkoutActivity,
  exerciseId: string,
): ExerciseWorkoutSnapshot | null {
  const exercises = activity.exercises.filter((entry) => entry.exerciseId === exerciseId)
  if (exercises.length === 0) return null

  const setPerformances: ExerciseSetPerformance[] = []
  let totalReps = 0
  let maxRepsInSet = 0
  let maxWeight = 0

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      const perf = extractSetPerformance(set)
      if (!perf) continue
      setPerformances.push(perf)
      if (perf.actualReps != null) {
        totalReps += perf.actualReps
        maxRepsInSet = Math.max(maxRepsInSet, perf.actualReps)
      }
      if (perf.actualWeight != null) {
        maxWeight = Math.max(maxWeight, perf.actualWeight)
      }
    }
  }

  if (setPerformances.length === 0) return null

  const repsWithPlan = setPerformances.filter((p) => p.plannedReps != null && p.actualReps != null)
  const avgActualReps =
    repsWithPlan.length > 0
      ? repsWithPlan.reduce((sum, p) => sum + (p.actualReps ?? 0), 0) / repsWithPlan.length
      : null
  const avgPlannedReps =
    repsWithPlan.length > 0
      ? repsWithPlan.reduce((sum, p) => sum + (p.plannedReps ?? 0), 0) / repsWithPlan.length
      : null

  return {
    activityId: activity.id,
    completedAt: activity.completedAt,
    heroDayKey: activity.heroDayKey,
    setPerformances,
    totalReps,
    maxRepsInSet,
    maxWeight,
    avgActualReps,
    avgPlannedReps,
    setsExceededReps: setPerformances.filter((p) => p.exceededPlannedReps).length,
    setsBelowReps: setPerformances.filter((p) => p.belowPlannedReps).length,
    setsWithPlannedReps: setPerformances.filter((p) => p.plannedReps != null).length,
  }
}

export function analyzeExerciseTrend(
  exerciseId: string,
  activities: WorkoutActivity[],
  lookback = TREND_WORKOUT_LOOKBACK,
): ExerciseTrainingTrend {
  const relevant = activities
    .filter((activity) => activity.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, lookback)

  const snapshots = relevant
    .map((activity) => extractExerciseSnapshot(activity, exerciseId))
    .filter((entry): entry is ExerciseWorkoutSnapshot => entry != null)
    .reverse()

  let consecutiveExceededReps = 0
  let consecutiveBelowReps = 0
  let exceededRepsWorkoutCount = 0
  let belowRepsWorkoutCount = 0

  for (let i = snapshots.length - 1; i >= 0; i -= 1) {
    const snap = snapshots[i]
    const exceededWorkout =
      snap.setsWithPlannedReps > 0 &&
      snap.setsExceededReps >= Math.ceil(snap.setsWithPlannedReps * 0.5)
    const belowWorkout =
      snap.setsWithPlannedReps > 0 &&
      snap.setsBelowReps >= Math.ceil(snap.setsWithPlannedReps * 0.5)

    if (exceededWorkout) {
      consecutiveExceededReps += 1
      consecutiveBelowReps = 0
      exceededRepsWorkoutCount += 1
    } else if (belowWorkout) {
      consecutiveBelowReps += 1
      consecutiveExceededReps = 0
      belowRepsWorkoutCount += 1
    } else {
      consecutiveExceededReps = 0
      consecutiveBelowReps = 0
    }
  }

  let avgFrequencyDays: number | null = null
  if (snapshots.length >= 2) {
    const first = new Date(snapshots[0].completedAt).getTime()
    const last = new Date(snapshots[snapshots.length - 1].completedAt).getTime()
    const daySpan = Math.max(1, (last - first) / (1000 * 60 * 60 * 24))
    avgFrequencyDays = Math.round((daySpan / (snapshots.length - 1)) * 10) / 10
  }

  return {
    exerciseId,
    snapshots,
    workoutCount: snapshots.length,
    consecutiveExceededReps,
    consecutiveBelowReps,
    exceededRepsWorkoutCount,
    belowRepsWorkoutCount,
    avgFrequencyDays,
  }
}

export function countFamilyWorkouts(
  memberExerciseIds: string[],
  activities: WorkoutActivity[],
): number {
  const memberSet = new Set(memberExerciseIds)
  return activities.filter((activity) =>
    activity.exercises.some((e) => memberSet.has(e.exerciseId)),
  ).length
}

export function countExerciseWorkouts(
  exerciseId: string,
  activities: WorkoutActivity[],
): number {
  return activities.filter((activity) =>
    activity.exercises.some((e) => e.exerciseId === exerciseId),
  ).length
}

export function hasExerciseInHistory(
  exerciseId: string,
  activities: WorkoutActivity[],
): boolean {
  return countExerciseWorkouts(exerciseId, activities) > 0
}

export function getMaxRepsFromTraining(
  exerciseId: string,
  activities: WorkoutActivity[],
): number {
  let max = 0
  for (const activity of activities) {
    const snap = extractExerciseSnapshot(activity, exerciseId)
    if (snap) max = Math.max(max, snap.maxRepsInSet)
  }
  return max
}

export function getRecentWorkoutGapDays(
  activities: WorkoutActivity[],
  now: Date,
): number | null {
  if (activities.length === 0) return null
  const latest = activities.reduce((max, a) =>
    a.completedAt > max ? a.completedAt : max,
  activities[0].completedAt)
  const diffMs = now.getTime() - new Date(latest).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
