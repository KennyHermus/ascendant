import type { WorkoutActivity } from '@/types/workout'
import type { PerformanceState } from '@/types/performance'
import type { CoachingState } from '@/types/progression'

/**
 * Future Exercise Mastery extension points.
 *
 * Mastery measures long-term proficiency — distinct from peak Personal Records.
 * Future calculations may consider consistency, volume, assessments, PRs,
 * frequency, time spent, and recommendations followed.
 */
export interface ExerciseMasteryInput {
  trainingActivities: WorkoutActivity[]
  performance: PerformanceState
  progression: CoachingState
}

export interface ExerciseMasteryScore {
  exerciseId: string
  /** 0–100 proficiency score — not computed yet. */
  score: number | null
  factors: string[]
}

export function getExerciseMasteryScores(
  _input: ExerciseMasteryInput,
): ExerciseMasteryScore[] {
  return []
}

/** Future: training readiness score before heavy sessions. */
export function getTrainingReadinessScore(_input: ExerciseMasteryInput): number | null {
  return null
}

/** Future: fatigue / recovery estimation. */
export function getFatigueEstimate(_input: ExerciseMasteryInput): number | null {
  return null
}

/** Future: adaptive workout generation — NOT implemented. */
export function generateAdaptiveWorkout(_input: ExerciseMasteryInput): null {
  return null
}
