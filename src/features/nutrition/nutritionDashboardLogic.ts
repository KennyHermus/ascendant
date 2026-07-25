import {
  getMealActivitiesForHeroDay,
  sortMealActivitiesByTime,
} from '@/features/nutrition/nutritionLogic'
import { computeActivitiesTotals, type NutrientTotals } from '@/features/nutrition/nutritionStatistics'
import { isMealConsistentDay } from '@/features/nutrition/nutritionStreakLogic'
import { MEAL_TYPES, REQUIRED_MEAL_TYPES } from '@/types/nutrition'
import type { MealType, NutritionState, NutritionTargets } from '@/types/nutrition'

export interface NutritionTargetProgress {
  consumed: number
  target: number
  /** `consumed / target` in [0, ∞), or null when there's no target / no data basis. */
  percent: number | null
}

export interface MealTimingEntry {
  activityId: string
  mealType: MealType
  completedAt: string
}

/**
 * Daily Nutrition Summary for one Hero Day. When `heroDayKey` is the active
 * day, `missingRequiredMealTypes` reads as "not logged yet" (the day isn't
 * over); for a past day it reads as genuinely missed.
 */
export interface DailyNutritionSummary {
  heroDayKey: string
  mealsLogged: MealType[]
  mealTiming: MealTimingEntry[]
  totals: NutrientTotals
  targets: NutritionTargets
  targetCompletion: {
    protein: NutritionTargetProgress
    calories: NutritionTargetProgress
    water: NutritionTargetProgress
  }
  missingRequiredMealTypes: MealType[]
  isConsistentDay: boolean
}

function progressFor(consumed: number, target: number | null): NutritionTargetProgress {
  return {
    consumed,
    target: target ?? 0,
    percent: target != null && target > 0 ? consumed / target : null,
  }
}

export function getDailyNutritionSummary(
  state: NutritionState,
  heroDayKey: string,
): DailyNutritionSummary {
  const dayActivities = getMealActivitiesForHeroDay(state, heroDayKey)
  const sorted = sortMealActivitiesByTime(dayActivities)
  const totals = computeActivitiesTotals(dayActivities)
  const loggedTypes = new Set(dayActivities.map((activity) => activity.mealType))

  return {
    heroDayKey,
    mealsLogged: MEAL_TYPES.filter((mealType) => loggedTypes.has(mealType)),
    mealTiming: sorted.map((activity) => ({
      activityId: activity.id,
      mealType: activity.mealType,
      completedAt: activity.completedAt,
    })),
    totals,
    targets: state.targets,
    targetCompletion: {
      protein: progressFor(totals.proteinGrams, state.targets.proteinGrams),
      calories: progressFor(totals.calories, state.targets.calories),
      // No water intake logging exists yet — progress is intentionally untracked.
      water: { consumed: 0, target: state.targets.waterMl ?? 0, percent: null },
    },
    missingRequiredMealTypes: REQUIRED_MEAL_TYPES.filter(
      (mealType) => !loggedTypes.has(mealType),
    ),
    isConsistentDay: isMealConsistentDay(dayActivities),
  }
}
