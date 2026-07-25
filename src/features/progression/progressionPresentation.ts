import { EXERCISE_BY_ID } from '@/data/exercises'
import type { CoachingRecommendation, RecommendationConfidence } from '@/types/progression'

export const CONFIDENCE_LABELS: Record<RecommendationConfidence, string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
  very_high: 'Very high confidence',
}

export const CONFIDENCE_BADGE_CLASSES: Record<RecommendationConfidence, string> = {
  low: 'border-stone-600/50 bg-stone-900/40 text-stone-400',
  medium: 'border-sky-800/50 bg-sky-950/30 text-sky-200',
  high: 'border-emerald-800/50 bg-emerald-950/30 text-emerald-200',
  very_high: 'border-amber-700/50 bg-amber-950/30 text-amber-100',
}

export function formatRecommendationKind(kind: CoachingRecommendation['kind']): string {
  switch (kind) {
    case 'increase_weight':
      return 'Increase weight'
    case 'increase_reps':
      return 'Increase reps'
    case 'maintain_training':
      return 'Maintain training'
    case 'reduce_weight':
      return 'Reduce weight'
    case 'recommend_assessment':
      return 'Performance assessment'
    case 'introduce_advanced_exercise':
      return 'New exercise'
    case 'improve_consistency':
      return 'Consistency'
    case 'add_recovery':
      return 'Recovery'
    default:
      return 'Coaching'
  }
}

export function formatRecommendationHeadline(rec: CoachingRecommendation): string {
  if (rec.targetExerciseId) {
    const name = EXERCISE_BY_ID.get(rec.targetExerciseId)?.name ?? rec.targetExerciseId
    return `Ready for ${name}`
  }
  return rec.title
}

export function formatRecommendationSummary(rec: CoachingRecommendation): string {
  return rec.message
}
