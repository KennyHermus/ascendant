import { EXERCISE_BY_ID } from '@/data/exercises'
import { getMealActivitiesForHeroDay } from '@/features/nutrition/nutritionLogic'
import { computeActivitiesTotals } from '@/features/nutrition/nutritionStatistics'
import {
  formatRecommendationHeadline,
} from '@/features/progression/progressionPresentation'
import { getActiveHeroDayKey } from '@/lib/timeService'
import type { CoachingRecommendation, RecommendationConfidence } from '@/types/progression'
import type { NutritionState } from '@/types/nutrition'

export interface HeroCoachingItem {
  id: string
  headline: string
  detail: string
  source: 'workout' | 'nutrition'
  priority: number
}

const CONFIDENCE_PRIORITY: Record<RecommendationConfidence, number> = {
  low: 10,
  medium: 30,
  high: 50,
  very_high: 70,
}

const KIND_PRIORITY: Partial<Record<CoachingRecommendation['kind'], number>> = {
  recommend_assessment: 25,
  increase_weight: 20,
  introduce_advanced_exercise: 18,
  increase_reps: 15,
  improve_consistency: 12,
  maintain_training: 8,
  reduce_weight: 8,
  add_recovery: 6,
}

function coachingPriority(rec: CoachingRecommendation): number {
  return (CONFIDENCE_PRIORITY[rec.confidence] ?? 0) + (KIND_PRIORITY[rec.kind] ?? 0)
}

function workoutCoachingItem(rec: CoachingRecommendation): HeroCoachingItem {
  const exerciseName = rec.exerciseId
    ? EXERCISE_BY_ID.get(rec.exerciseId)?.name
    : undefined
  const headline = formatRecommendationHeadline(rec)
  const detail =
    rec.kind === 'increase_weight' && exerciseName
      ? `Increase ${exerciseName} weight.`
      : rec.message

  return {
    id: `workout:${rec.id}`,
    headline,
    detail,
    source: 'workout',
    priority: coachingPriority(rec),
  }
}

function nutritionProteinItem(
  nutrition: NutritionState,
  heroDayKey: string,
): HeroCoachingItem | null {
  const dayActivities = getMealActivitiesForHeroDay(nutrition, heroDayKey)
  const protein = computeActivitiesTotals(dayActivities).proteinGrams
  const target = nutrition.targets.proteinGrams
  if (protein >= target) return null

  return {
    id: 'nutrition:protein-target',
    headline: 'Protein target has not been met today',
    detail: `${Math.round(protein)}g logged · ${target}g target`,
    source: 'nutrition',
    priority: 35,
  }
}

/**
 * Highest-priority coaching items for Today's Journey — workout engine
 * recommendations plus same-day nutrition nudges. Capped to avoid clutter.
 */
export function selectHeroCoachingItems(input: {
  activeRecommendations: CoachingRecommendation[]
  nutrition: NutritionState
  now: Date
  maxItems?: number
}): HeroCoachingItem[] {
  const maxItems = input.maxItems ?? 3
  const heroDayKey = getActiveHeroDayKey(input.now)

  const items: HeroCoachingItem[] = input.activeRecommendations.map(workoutCoachingItem)

  const proteinItem = nutritionProteinItem(input.nutrition, heroDayKey)
  if (proteinItem) items.push(proteinItem)

  return items
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxItems)
}
