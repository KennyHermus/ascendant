import { DEFAULT_NUTRITION_TARGETS } from '@/data/nutritionTargets'
import { NUTRITION_SCHEMA_VERSION } from '@/types/nutrition'
import type {
  FoodEntry,
  MealActivity,
  MealType,
  NutritionState,
  NutritionTargets,
} from '@/types/nutrition'

export function createEmptyNutritionState(): NutritionState {
  return {
    schemaVersion: NUTRITION_SCHEMA_VERSION,
    targets: { ...DEFAULT_NUTRITION_TARGETS },
    activities: [],
  }
}

export function mergeNutritionState(
  saved: Partial<NutritionState> | undefined,
): NutritionState {
  const defaults = createEmptyNutritionState()
  if (!saved) return defaults

  return {
    ...defaults,
    ...saved,
    schemaVersion: NUTRITION_SCHEMA_VERSION,
    targets: { ...defaults.targets, ...saved.targets },
    activities: saved.activities ?? [],
  }
}

/** Fresh `FoodEntry` with a stable id — used by the meal log form before a meal is saved. */
export function createFoodEntry(partial: Partial<Omit<FoodEntry, 'id'>> = {}): FoodEntry {
  return { id: crypto.randomUUID(), ...partial }
}

export interface LogMealInput {
  mealType: MealType
  foodEntries: FoodEntry[]
  notes?: string
}

/** Builds one immutable `MealActivity` record — always a completed, instant log (no session lifecycle). */
export function buildMealActivity(
  input: LogMealInput,
  now: Date,
  heroDayKey: string,
  resolvedQuestId: string | null = null,
): MealActivity {
  const timestamp = now.toISOString()
  return {
    id: crypto.randomUUID(),
    kind: 'nutrition',
    questId: resolvedQuestId,
    heroDayKey,
    startedAt: timestamp,
    completedAt: timestamp,
    completionGrade: 'completed',
    mealType: input.mealType,
    foodEntries: input.foodEntries.filter(hasAnyFoodEntryData),
    ...(input.notes ? { notes: input.notes } : {}),
  }
}

/** Empty rows added by the form (no name, no macros) are dropped rather than persisted. */
function hasAnyFoodEntryData(entry: FoodEntry): boolean {
  return (
    !!entry.name?.trim() ||
    entry.proteinGrams != null ||
    entry.carbsGrams != null ||
    entry.fatGrams != null ||
    entry.calories != null ||
    !!entry.notes?.trim()
  )
}

export function appendMealActivity(
  state: NutritionState,
  activity: MealActivity,
): NutritionState {
  return { ...state, activities: [...state.activities, activity] }
}

export function removeMealActivity(
  state: NutritionState,
  activityId: string,
): NutritionState {
  const activities = state.activities.filter((activity) => activity.id !== activityId)
  if (activities.length === state.activities.length) return state
  return { ...state, activities }
}

export function updateNutritionTargets(
  state: NutritionState,
  patch: Partial<NutritionTargets>,
): NutritionState {
  return { ...state, targets: { ...state.targets, ...patch } }
}

export function getMealActivitiesForHeroDay(
  state: NutritionState,
  heroDayKey: string,
): MealActivity[] {
  return state.activities.filter((activity) => activity.heroDayKey === heroDayKey)
}

/** Sorted oldest → newest by completion time — for timelines and "meal timing" displays. */
export function sortMealActivitiesByTime(activities: MealActivity[]): MealActivity[] {
  return [...activities].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  )
}
