import { recordMealLogged } from '@/features/events/eventLogic'
import { formatCalendarDateKey, parseCalendarDateKey } from '@/lib/timeService'
import type { GameEvent } from '@/types/event'
import type { FoodEntry, MealActivity, MealType, NutritionState } from '@/types/nutrition'

const SAMPLE_FOOD_BY_MEAL: Record<MealType, Omit<FoodEntry, 'id'>[]> = {
  breakfast: [
    { name: 'Oatmeal & eggs', proteinGrams: 25, carbsGrams: 45, fatGrams: 12, calories: 380 },
  ],
  lunch: [
    { name: 'Chicken & rice bowl', proteinGrams: 45, carbsGrams: 60, fatGrams: 15, calories: 550 },
  ],
  dinner: [
    { name: 'Salmon & vegetables', proteinGrams: 40, carbsGrams: 35, fatGrams: 20, calories: 500 },
  ],
  snack: [
    { name: 'Greek yogurt & almonds', proteinGrams: 20, carbsGrams: 15, fatGrams: 10, calories: 250 },
  ],
}

/** Pushes a day's protein total over the default target — used for a recent streak of "on target" days. */
const PROTEIN_SHAKE: Omit<FoodEntry, 'id'> = {
  name: 'Protein shake',
  proteinGrams: 70,
  carbsGrams: 5,
  fatGrams: 3,
  calories: 320,
}

/** How many of the most recent sample days get the protein boost (demonstrates a target streak). */
const PROTEIN_STREAK_DAYS = 5
/** Dinner is pushed this far past its usual time on "delayed" sample days. */
const DINNER_DELAY_MINUTES = 105

const MEAL_TIME_OF_DAY: Record<MealType, { hour: number; minute: number }> = {
  breakfast: { hour: 7, minute: 30 },
  lunch: { hour: 12, minute: 30 },
  dinner: { hour: 19, minute: 0 },
  snack: { hour: 15, minute: 30 },
}

function shiftHeroDayKey(baseKey: string, offsetDays: number): string {
  const date = parseCalendarDateKey(baseKey)
  date.setDate(date.getDate() - offsetDays)
  return formatCalendarDateKey(date)
}

function buildSampleMealActivity(
  mealType: MealType,
  heroDayKey: string,
  at: Date,
  extraEntries: Omit<FoodEntry, 'id'>[] = [],
): MealActivity {
  const timestamp = at.toISOString()
  return {
    id: crypto.randomUUID(),
    kind: 'nutrition',
    questId: null,
    heroDayKey,
    startedAt: timestamp,
    completedAt: timestamp,
    completionGrade: 'completed',
    mealType,
    foodEntries: [...SAMPLE_FOOD_BY_MEAL[mealType], ...extraEntries].map((food) => ({
      id: crypto.randomUUID(),
      ...food,
    })),
  }
}

/**
 * Backfills sample meal history so Nutrition Analytics / Insights / DevTools
 * have signal. Deterministic per `offset` (no real randomness) — mirrors
 * `generateSampleWorkoutHistory`. Frequencies are chosen to clear the
 * Insights Engine's thresholds (see `insightsNutrition.ts`), not just to be
 * "occasional":
 * - Breakfast is skipped 2 of every 3 days → "consistently misses breakfast".
 * - Dinner is delayed 2 of every 3 days → "dinner is frequently delayed".
 * - The most recent `PROTEIN_STREAK_DAYS` days get an extra protein source →
 *   a live "protein target achieved N days in a row" streak.
 */
export function generateSampleNutritionHistory(input: {
  nutrition: NutritionState
  todayKey: string
  days?: number
  now: Date
}): { nutrition: NutritionState; events: GameEvent[] } {
  const days = input.days ?? 14
  const activities: MealActivity[] = [...input.nutrition.activities]
  const events: GameEvent[] = []

  for (let offset = 1; offset <= days; offset += 1) {
    const heroDayKey = shiftHeroDayKey(input.todayKey, offset)
    if (activities.some((activity) => activity.heroDayKey === heroDayKey)) continue

    const day = parseCalendarDateKey(heroDayKey)
    const skipBreakfast = offset % 3 !== 0
    const dinnerDelayed = offset % 3 !== 0
    const boostProtein = offset <= PROTEIN_STREAK_DAYS

    const mealsToday: MealType[] = []
    if (!skipBreakfast) mealsToday.push('breakfast')
    mealsToday.push('lunch', 'dinner')
    if (offset % 5 === 0) mealsToday.push('snack')

    for (const mealType of mealsToday) {
      const base = MEAL_TIME_OF_DAY[mealType]
      const at = new Date(day)
      const delayMinutes = mealType === 'dinner' && dinnerDelayed ? DINNER_DELAY_MINUTES : 0
      at.setHours(base.hour, base.minute + delayMinutes, 0, 0)

      const activity = buildSampleMealActivity(
        mealType,
        heroDayKey,
        at,
        boostProtein && mealType === 'lunch' ? [PROTEIN_SHAKE] : [],
      )
      activities.push(activity)
      events.push(recordMealLogged(activity, at))
    }
  }

  return {
    nutrition: { ...input.nutrition, activities },
    events,
  }
}
