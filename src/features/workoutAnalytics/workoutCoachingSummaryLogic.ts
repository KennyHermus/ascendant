import { getProgressionAnalytics } from '@/features/progression/progressionAnalyticsLogic'
import type { TrainingDistribution } from '@/features/workoutAnalytics/trainingDistributionLogic'
import type { WorkoutAnalyticsInput } from '@/features/workoutAnalytics/workoutAnalyticsInput'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { CoachingRecommendation, ProgressionRecommendationKind } from '@/types/progression'

export interface TrainingImbalanceSuggestion {
  id: string
  label: string
  detail: string
}

export interface WorkoutCoachingSummary {
  mostFrequentKinds: { kind: ProgressionRecommendationKind; count: number }[]
  highConfidenceRecommendations: CoachingRecommendation[]
  readyForAssessment: CoachingRecommendation[]
  trainingImbalanceSuggestions: TrainingImbalanceSuggestion[]
  activeRecommendationCount: number
}

/** Minimum completed sets before imbalance suggestions are surfaced (avoids noise on tiny samples). */
const MIN_SETS_FOR_IMBALANCE = 20

function bucketPercent(buckets: TrainingDistribution['byMuscleRegion'], id: string): number {
  return buckets.find((b) => b.id === id)?.percent ?? 0
}

/**
 * Objective observations derived purely from the training distribution —
 * distinct from (and additive to) the Progression Engine's own
 * recommendations, which are trend-based rather than distribution-based.
 */
function deriveImbalanceSuggestions(
  distribution: TrainingDistribution,
): TrainingImbalanceSuggestion[] {
  if (distribution.totalCompletedSets < MIN_SETS_FOR_IMBALANCE) return []

  const suggestions: TrainingImbalanceSuggestion[] = []

  const upper = bucketPercent(distribution.byMuscleRegion, 'upper')
  const lower = bucketPercent(distribution.byMuscleRegion, 'lower')
  if (upper > 0 && lower > 0 && upper > lower * 2) {
    suggestions.push({
      id: 'upper-lower-imbalance',
      label: 'Upper body training dominates',
      detail: `Upper body work is ${upper}% of your completed sets versus ${lower}% lower body — consider balancing your program.`,
    })
  } else if (lower > 0 && upper > 0 && lower > upper * 2) {
    suggestions.push({
      id: 'lower-upper-imbalance',
      label: 'Lower body training dominates',
      detail: `Lower body work is ${lower}% of your completed sets versus ${upper}% upper body — consider balancing your program.`,
    })
  } else if (upper > 0 && lower === 0) {
    suggestions.push({
      id: 'no-lower-body',
      label: 'No lower body training logged',
      detail: 'All recent training has targeted the upper body — consider adding lower body work.',
    })
  } else if (lower > 0 && upper === 0) {
    suggestions.push({
      id: 'no-upper-body',
      label: 'No upper body training logged',
      detail: 'All recent training has targeted the lower body — consider adding upper body work.',
    })
  }

  const cardio = bucketPercent(distribution.byTrainingType, 'cardio')
  const strength = bucketPercent(distribution.byTrainingType, 'strength')
  if (strength > 0 && cardio === 0) {
    suggestions.push({
      id: 'no-cardio',
      label: 'No cardio training logged',
      detail: 'Training has been entirely strength-focused — consider adding cardio or endurance work.',
    })
  } else if (cardio > 0 && strength > 0 && cardio > strength * 2) {
    suggestions.push({
      id: 'cardio-heavy',
      label: 'Cardio-heavy training',
      detail: `Cardio is ${cardio}% of your completed sets versus ${strength}% strength — consider adding strength work.`,
    })
  }

  const skill = bucketPercent(distribution.byRole, 'skill')
  const foundation = bucketPercent(distribution.byRole, 'foundation')
  if (foundation >= 25 && skill === 0) {
    suggestions.push({
      id: 'no-skill-work',
      label: 'No skill-focused training yet',
      detail: 'Foundation exercises are well established — check Coaching for advanced exercises you may be ready to practice.',
    })
  }

  return suggestions
}

export function getWorkoutCoachingSummary(
  input: WorkoutAnalyticsInput,
  distribution: TrainingDistribution,
  period: AnalyticsPeriod,
): WorkoutCoachingSummary {
  const progression = getProgressionAnalytics({
    coaching: input.coaching,
    period,
    now: input.now,
  })
  const active = input.coaching.activeRecommendations

  return {
    mostFrequentKinds: progression.mostFrequentKinds,
    highConfidenceRecommendations: active.filter(
      (r) => r.confidence === 'high' || r.confidence === 'very_high',
    ),
    readyForAssessment: active.filter((r) => r.kind === 'recommend_assessment'),
    trainingImbalanceSuggestions: deriveImbalanceSuggestions(distribution),
    activeRecommendationCount: active.length,
  }
}
