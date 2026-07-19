import type {
  ExerciseSetLog,
  SessionExerciseLog,
  WorkoutActivity,
  WorkoutSession,
} from '@/types/workout'

export interface WorkoutSetStats {
  totalSets: number
  completedSets: number
  totalReps: number
  totalVolume: number
}

export interface WorkoutExerciseStats extends WorkoutSetStats {
  exerciseCount: number
  completedExerciseCount: number
}

export interface WorkoutActivityStats extends WorkoutExerciseStats {
  durationMinutes: number | null
}

export interface WorkoutPeriodStats extends WorkoutActivityStats {
  workoutsCompleted: number
  averageDurationMinutes: number | null
  /** Workouts per week over the sampled period (null when period too short). */
  workoutFrequencyPerWeek: number | null
}

/** Volume = weight × reps for one set (0 when either missing). */
export function computeSetVolume(set: ExerciseSetLog): number {
  const weight = set.fields.weight ?? 0
  const reps = set.fields.reps ?? 0
  if (weight <= 0 || reps <= 0) return 0
  return weight * reps
}

export function computeSetReps(set: ExerciseSetLog): number {
  if (!set.completed) return 0
  return set.fields.reps ?? 0
}

export function aggregateSetStats(sets: ExerciseSetLog[]): WorkoutSetStats {
  let completedSets = 0
  let totalReps = 0
  let totalVolume = 0

  for (const set of sets) {
    if (set.completed) {
      completedSets += 1
      totalReps += computeSetReps(set)
      totalVolume += computeSetVolume(set)
    }
  }

  return {
    totalSets: sets.length,
    completedSets,
    totalReps,
    totalVolume,
  }
}

export function isExerciseComplete(exercise: SessionExerciseLog): boolean {
  return exercise.sets.length > 0 && exercise.sets.every((set) => set.completed)
}

export function aggregateExerciseStats(
  exercises: SessionExerciseLog[],
): WorkoutExerciseStats {
  let completedExerciseCount = 0
  let totalSets = 0
  let completedSets = 0
  let totalReps = 0
  let totalVolume = 0

  for (const exercise of exercises) {
    const setStats = aggregateSetStats(exercise.sets)
    totalSets += setStats.totalSets
    completedSets += setStats.completedSets
    totalReps += setStats.totalReps
    totalVolume += setStats.totalVolume

    if (isExerciseComplete(exercise)) completedExerciseCount += 1
  }

  return {
    exerciseCount: exercises.length,
    completedExerciseCount,
    totalSets,
    completedSets,
    totalReps,
    totalVolume,
  }
}

export function computeActivityStatistics(
  activity: WorkoutActivity,
): WorkoutActivityStats {
  const exerciseStats = aggregateExerciseStats(activity.exercises)

  return {
    ...exerciseStats,
    durationMinutes: activity.durationMinutes,
  }
}

export function computeActivitiesStatistics(
  activities: WorkoutActivity[],
  periodDays?: number,
): WorkoutPeriodStats {
  let workoutsCompleted = 0
  let exerciseCount = 0
  let completedExerciseCount = 0
  let totalSets = 0
  let completedSets = 0
  let totalReps = 0
  let totalVolume = 0
  let totalDurationMinutes = 0
  let durationCount = 0

  for (const activity of activities) {
    workoutsCompleted += 1
    const stats = computeActivityStatistics(activity)
    exerciseCount += stats.exerciseCount
    completedExerciseCount += stats.completedExerciseCount
    totalSets += stats.totalSets
    completedSets += stats.completedSets
    totalReps += stats.totalReps
    totalVolume += stats.totalVolume
    if (stats.durationMinutes != null) {
      totalDurationMinutes += stats.durationMinutes
      durationCount += 1
    }
  }

  const averageDurationMinutes =
    durationCount > 0 ? Math.round(totalDurationMinutes / durationCount) : null

  const workoutFrequencyPerWeek =
    periodDays != null && periodDays > 0
      ? Math.round((workoutsCompleted / periodDays) * 7 * 10) / 10
      : null

  return {
    workoutsCompleted,
    exerciseCount,
    completedExerciseCount,
    totalSets,
    completedSets,
    totalReps,
    totalVolume,
    durationMinutes: durationCount > 0 ? totalDurationMinutes : null,
    averageDurationMinutes,
    workoutFrequencyPerWeek,
  }
}

export function computeSessionStatistics(
  session: WorkoutSession,
): WorkoutExerciseStats {
  return aggregateExerciseStats(session.exercises)
}
