/**
 * Exercise Progression Engine (v0.0.4).
 *
 * Combines training history, Official PRs, exercise families, roles, and
 * prerequisites into coaching recommendations — never auto-modifies workouts.
 */

export const PROGRESSION_SCHEMA_VERSION = 1

export const EXERCISE_ROLES = [
  'foundation',
  'variation',
  'strength',
  'power',
  'skill',
  'accessory',
] as const

export type ExerciseRole = (typeof EXERCISE_ROLES)[number]

export const PROGRESSION_RECOMMENDATION_KINDS = [
  'increase_weight',
  'increase_reps',
  'maintain_training',
  'reduce_weight',
  'recommend_assessment',
  'introduce_advanced_exercise',
  'improve_consistency',
  'add_recovery',
] as const

export type ProgressionRecommendationKind =
  (typeof PROGRESSION_RECOMMENDATION_KINDS)[number]

export const RECOMMENDATION_CONFIDENCE_LEVELS = [
  'low',
  'medium',
  'high',
  'very_high',
] as const

export type RecommendationConfidence = (typeof RECOMMENDATION_CONFIDENCE_LEVELS)[number]

/** Prerequisite kinds resolved by `prerequisiteLogic.ts`. */
export const PREREQUISITE_KINDS = [
  'push_up_benchmark',
  'shoulder_strength',
  'triceps_strength',
  'arm_strength',
  'core_stability',
  'balance',
  'pseudo_planche_practice',
  'wrist_strength',
  'recommended_push_up_pr',
] as const

export type PrerequisiteKind = (typeof PREREQUISITE_KINDS)[number]

export interface ExercisePrerequisiteDefinition {
  kind: PrerequisiteKind
  label: string
  /** Optional threshold hints for documentation / future tuning. */
  minPushUpReps?: number
  minWorkouts?: number
}

export interface AdvancedExerciseDefinition {
  exerciseId: string
  name: string
  exerciseFamilyId: string
  roles: ExerciseRole[]
  prerequisites: ExercisePrerequisiteDefinition[]
}

export interface CoachingRecommendation {
  id: string
  kind: ProgressionRecommendationKind
  /** Primary exercise the recommendation applies to (when applicable). */
  exerciseId?: string
  exerciseFamilyId?: string
  /** Target advanced exercise for `introduce_advanced_exercise`. */
  targetExerciseId?: string
  title: string
  message: string
  reason: string
  confidence: RecommendationConfidence
  generatedAt: string
  heroDayKey: string
}

export interface CoachingRecommendationHistoryEntry extends CoachingRecommendation {
  recordedAt: string
  /** Future: user accepted the recommendation. */
  accepted?: boolean
  /** Future: user dismissed the recommendation. */
  dismissed?: boolean
}

export interface CoachingState {
  schemaVersion: number
  activeRecommendations: CoachingRecommendation[]
  recommendationHistory: CoachingRecommendationHistoryEntry[]
  lastGeneratedAt: string | null
}

/** @deprecated Use CoachingState */
export type ProgressionState = CoachingState
