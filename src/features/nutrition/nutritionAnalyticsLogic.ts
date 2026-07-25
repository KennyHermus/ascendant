import { average, sumField } from '@/features/analytics/analyticsHelpers'
import { isDateInRange, resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import {
  computeDailyTotals,
  groupActivitiesByHeroDay,
} from '@/features/nutrition/nutritionStatistics'
import {
  computeMealConsistencyStreak,
  computeMealLoggingStreak,
  computeProteinTargetStreak,
  isMealConsistentDay,
} from '@/features/nutrition/nutritionStreakLogic'
import { getActiveHeroDayKey } from '@/lib/timeService'
import type { NutritionAnalyticsInput } from '@/features/nutrition/nutritionAnalyticsInput'
import { REQUIRED_MEAL_TYPES } from '@/types/nutrition'
import type { MealActivity, MealType } from '@/types/nutrition'
import type { AnalyticsPeriod, NutritionAnalytics } from '@/types/analytics'

export type { NutritionAnalytics }

/** Calories are treated as "on target" within this band — a target can be a floor or ceiling. */
const CALORIE_TARGET_TOLERANCE = 0.1

function filterActivitiesForPeriod(
  activities: MealActivity[],
  period: AnalyticsPeriod,
  input: NutritionAnalyticsInput,
): MealActivity[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  return activities.filter((activity) => isDateInRange(activity.heroDayKey, range))
}

function computeMissedMealCounts(
  dailyGroups: Map<string, MealActivity[]>,
): Record<MealType, number> {
  const counts: Record<MealType, number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  }

  for (const dayActivities of dailyGroups.values()) {
    const loggedTypes = new Set(dayActivities.map((activity) => activity.mealType))
    for (const mealType of REQUIRED_MEAL_TYPES) {
      if (!loggedTypes.has(mealType)) counts[mealType] += 1
    }
  }

  return counts
}

function computeAverageMealTimeMinutes(
  activities: MealActivity[],
): Partial<Record<MealType, number>> {
  const byType = new Map<MealType, number[]>()
  for (const activity of activities) {
    const date = new Date(activity.completedAt)
    const minutes = date.getHours() * 60 + date.getMinutes()
    const existing = byType.get(activity.mealType)
    if (existing) existing.push(minutes)
    else byType.set(activity.mealType, [minutes])
  }

  const result: Partial<Record<MealType, number>> = {}
  for (const [mealType, minutesList] of byType) {
    const avg = average(sumField(minutesList, (m) => m), minutesList.length)
    if (avg !== null) result[mealType] = Math.round(avg)
  }
  return result
}

export function getNutritionAnalytics(
  input: NutritionAnalyticsInput,
  period: AnalyticsPeriod = 'last365',
): NutritionAnalytics {
  const activities = filterActivitiesForPeriod(input.nutrition.activities, period, input)

  const dailyTotals = computeDailyTotals(activities)
  const daysTracked = dailyTotals.length
  const targets = input.nutrition.targets

  const totalProtein = sumField(dailyTotals, (d) => d.totals.proteinGrams)
  const totalCalories = sumField(dailyTotals, (d) => d.totals.calories)

  const proteinDaysMet = dailyTotals.filter(
    (d) => d.totals.proteinGrams >= targets.proteinGrams,
  ).length
  const calorieDaysOnTarget = dailyTotals.filter((d) => {
    if (targets.calories <= 0) return false
    const deviation = Math.abs(d.totals.calories - targets.calories) / targets.calories
    return deviation <= CALORIE_TARGET_TOLERANCE
  }).length

  const dailyGroups = groupActivitiesByHeroDay(activities)
  const consistentDays = [...dailyGroups.values()].filter(isMealConsistentDay).length

  const todayHeroDayKey = getActiveHeroDayKey(input.now)

  return {
    mealsLogged: activities.length,
    daysTracked,
    averageProteinPerDay: average(totalProtein, daysTracked),
    averageCaloriesPerDay: average(totalCalories, daysTracked),
    proteinTargetAdherenceRate: average(proteinDaysMet, daysTracked),
    calorieTargetAdherenceRate: average(calorieDaysOnTarget, daysTracked),
    mealConsistencyRate: average(consistentDays, daysTracked),
    currentMealLoggingStreak: computeMealLoggingStreak(
      input.nutrition.activities,
      todayHeroDayKey,
    ),
    currentProteinTargetStreak: computeProteinTargetStreak(
      input.nutrition.activities,
      targets,
      todayHeroDayKey,
    ),
    currentMealConsistencyStreak: computeMealConsistencyStreak(
      input.nutrition.activities,
      todayHeroDayKey,
    ),
    missedMealCounts: computeMissedMealCounts(dailyGroups),
    averageMealTimeMinutes: computeAverageMealTimeMinutes(activities),
  }
}
