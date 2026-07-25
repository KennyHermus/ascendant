import { computeActivitiesTotals, groupActivitiesByHeroDay } from '@/features/nutrition/nutritionStatistics'
import { formatCalendarDateKey, parseCalendarDateKey } from '@/lib/timeService'
import { REQUIRED_MEAL_TYPES } from '@/types/nutrition'
import type { MealActivity, NutritionTargets } from '@/types/nutrition'

/**
 * Walks backward one Hero Day at a time counting consecutive days present in
 * `activeDays`. If `todayHeroDayKey` itself is not yet active, it's treated
 * as "still in progress" (not a break) and the walk starts from yesterday —
 * mirrors how quest streaks don't zero out mid-day. Otherwise identical to a
 * plain consecutive-day count starting at today.
 */
function computeConsecutiveDayStreak(
  activeDays: Set<string>,
  todayHeroDayKey: string,
): number {
  let streak = 0
  const cursor = parseCalendarDateKey(todayHeroDayKey)
  if (!activeDays.has(todayHeroDayKey)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (activeDays.has(formatCalendarDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function isMealConsistentDay(dayActivities: MealActivity[]): boolean {
  const loggedTypes = new Set(dayActivities.map((activity) => activity.mealType))
  return REQUIRED_MEAL_TYPES.every((mealType) => loggedTypes.has(mealType))
}

/** Consecutive Hero Days with at least one meal logged. */
export function computeMealLoggingStreak(
  activities: MealActivity[],
  todayHeroDayKey: string,
): number {
  const activeDays = new Set(groupActivitiesByHeroDay(activities).keys())
  return computeConsecutiveDayStreak(activeDays, todayHeroDayKey)
}

/** Consecutive Hero Days where breakfast, lunch, and dinner were all logged. */
export function computeMealConsistencyStreak(
  activities: MealActivity[],
  todayHeroDayKey: string,
): number {
  const byDay = groupActivitiesByHeroDay(activities)
  const consistentDays = new Set(
    [...byDay.entries()]
      .filter(([, dayActivities]) => isMealConsistentDay(dayActivities))
      .map(([heroDayKey]) => heroDayKey),
  )
  return computeConsecutiveDayStreak(consistentDays, todayHeroDayKey)
}

/** Consecutive Hero Days where consumed protein met or exceeded the target. */
export function computeProteinTargetStreak(
  activities: MealActivity[],
  targets: NutritionTargets,
  todayHeroDayKey: string,
): number {
  const byDay = groupActivitiesByHeroDay(activities)
  const metDays = new Set(
    [...byDay.entries()]
      .filter(
        ([, dayActivities]) =>
          computeActivitiesTotals(dayActivities).proteinGrams >= targets.proteinGrams,
      )
      .map(([heroDayKey]) => heroDayKey),
  )
  return computeConsecutiveDayStreak(metDays, todayHeroDayKey)
}
