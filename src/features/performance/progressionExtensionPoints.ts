import type { WorkoutActivity } from '@/types/workout'
import type {
  OfficialPersonalRecord,
  PersonalRecordHistoryEntry,
  PerformanceState,
} from '@/types/performance'

/**
 * Future Progression Engine inputs — not computed yet.
 * Combines training history + official PRs for recommendations.
 */
export interface ProgressionEngineInput {
  trainingActivities: WorkoutActivity[]
  officialRecords: OfficialPersonalRecord[]
  prHistory: PersonalRecordHistoryEntry[]
  performance: PerformanceState
}

export const PROGRESSION_RECOMMENDATION_KINDS = [
  'increase_weight',
  'increase_reps',
  'advance_variation',
  'recommend_assessment',
] as const

export type ProgressionRecommendationKind =
  (typeof PROGRESSION_RECOMMENDATION_KINDS)[number]

/** Stub recommendation — populated by the future Progression Engine. */
export interface ProgressionRecommendation {
  kind: ProgressionRecommendationKind
  exerciseFamilyId: string
  message: string
  /** Future: estimated PR, confidence, readiness scores. */
  confidence?: number
}

/**
 * Extension point for the Progression Engine (v0.0.5+).
 * Returns empty today — architecture only.
 */
export function getProgressionRecommendations(
  _input: ProgressionEngineInput,
): ProgressionRecommendation[] {
  return []
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
  _input: ProgressionEngineInput,
): PerformanceSessionScheduleHint[] {
  return []
}
