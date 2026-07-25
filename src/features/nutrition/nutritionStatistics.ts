import type { FoodEntry, MealActivity } from '@/types/nutrition'

export interface NutrientTotals {
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  calories: number
}

const EMPTY_TOTALS: NutrientTotals = {
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
  calories: 0,
}

/** Sums whichever nutrient fields are present; missing values contribute 0 — never `NaN`. */
export function computeFoodEntryTotals(entries: FoodEntry[]): NutrientTotals {
  return entries.reduce<NutrientTotals>(
    (totals, entry) => ({
      proteinGrams: totals.proteinGrams + (entry.proteinGrams ?? 0),
      carbsGrams: totals.carbsGrams + (entry.carbsGrams ?? 0),
      fatGrams: totals.fatGrams + (entry.fatGrams ?? 0),
      calories: totals.calories + (entry.calories ?? 0),
    }),
    { ...EMPTY_TOTALS },
  )
}

export function computeMealActivityTotals(activity: MealActivity): NutrientTotals {
  return computeFoodEntryTotals(activity.foodEntries)
}

/** Aggregate nutrient totals across any set of meal activities (a day, a period, etc). */
export function computeActivitiesTotals(activities: MealActivity[]): NutrientTotals {
  return activities.reduce<NutrientTotals>((totals, activity) => {
    const mealTotals = computeMealActivityTotals(activity)
    return {
      proteinGrams: totals.proteinGrams + mealTotals.proteinGrams,
      carbsGrams: totals.carbsGrams + mealTotals.carbsGrams,
      fatGrams: totals.fatGrams + mealTotals.fatGrams,
      calories: totals.calories + mealTotals.calories,
    }
  }, { ...EMPTY_TOTALS })
}

/** Groups activities by Hero Day key — the basis for daily rollups, streaks, and trend charts. */
export function groupActivitiesByHeroDay(
  activities: MealActivity[],
): Map<string, MealActivity[]> {
  const byDay = new Map<string, MealActivity[]>()
  for (const activity of activities) {
    const existing = byDay.get(activity.heroDayKey)
    if (existing) {
      existing.push(activity)
    } else {
      byDay.set(activity.heroDayKey, [activity])
    }
  }
  return byDay
}

/** Per-day nutrient totals, sorted oldest → newest — the shape trend charts consume. */
export function computeDailyTotals(
  activities: MealActivity[],
): { heroDayKey: string; totals: NutrientTotals }[] {
  const byDay = groupActivitiesByHeroDay(activities)
  return [...byDay.entries()]
    .map(([heroDayKey, dayActivities]) => ({
      heroDayKey,
      totals: computeActivitiesTotals(dayActivities),
    }))
    .sort((a, b) => (a.heroDayKey < b.heroDayKey ? -1 : a.heroDayKey > b.heroDayKey ? 1 : 0))
}
