import type { WorkoutActivity } from '@/types/workout'
import type {
  OfficialPersonalRecord,
  PersonalRecordHistoryEntry,
  PerformanceState,
} from '@/types/performance'
import type { CoachingRecommendation, CoachingState } from '@/types/progression'
import { generateCoachingRecommendations } from '@/features/progression/progressionEngineLogic'

/**
 * Progression Engine inputs — combines training history + Official PRs.
 */
export interface ProgressionEngineInput {
  trainingActivities: WorkoutActivity[]
  officialRecords: OfficialPersonalRecord[]
  prHistory: PersonalRecordHistoryEntry[]
  performance: PerformanceState
  coaching?: CoachingState
}

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

/** Coaching recommendation surfaced by the Progression Engine. */
export interface ProgressionRecommendation {
  kind: ProgressionRecommendationKind
  exerciseFamilyId?: string
  exerciseId?: string
  targetExerciseId?: string
  message: string
  title: string
  reason: string
  confidence: CoachingRecommendation['confidence']
}

export function getProgressionRecommendations(
  input: ProgressionEngineInput,
): ProgressionRecommendation[] {
  return generateCoachingRecommendations({
    trainingActivities: input.trainingActivities,
    performance: input.performance,
    now: new Date(),
  }).map((rec) => ({
    kind: rec.kind,
    exerciseFamilyId: rec.exerciseFamilyId,
    exerciseId: rec.exerciseId,
    targetExerciseId: rec.targetExerciseId,
    message: rec.message,
    title: rec.title,
    reason: rec.reason,
    confidence: rec.confidence,
  }))
}

/** Future: estimated PR from training data without an assessment. */
export interface EstimatedPrProjection {
  exerciseId: string
  prType: import('@/types/performance').PrType
  estimatedValue: number
  confidence: number
}

export function getEstimatedPrProjections(
  _input: ProgressionEngineInput,
): EstimatedPrProjection[] {
  return []
}

/** Future: weekly performance session scheduling. */
export interface PerformanceSessionScheduleHint {
  recommendedAssessmentId: string
  reason: string
}

export function getPerformanceSessionScheduleHints(
  input: ProgressionEngineInput,
): PerformanceSessionScheduleHint[] {
  return getProgressionRecommendations(input)
    .filter((rec) => rec.kind === 'recommend_assessment')
    .map((rec) => ({
      recommendedAssessmentId: rec.exerciseId ?? '',
      reason: rec.reason,
    }))
    .filter((hint) => hint.recommendedAssessmentId.length > 0)
}

/** Re-export mastery extension points for future coaching systems. */
export {
  getExerciseMasteryScores,
  getTrainingReadinessScore,
  getFatigueEstimate,
} from '@/features/progression/masteryExtensionPoints'
