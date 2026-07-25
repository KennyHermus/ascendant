import type { ActivityBase } from '@/types/activity'

export const NUTRITION_SCHEMA_VERSION = 1

/** Breakfast/Lunch/Dinner are the expected daily meals; Snack is optional and never "missed". */
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

/** Meals expected every Hero Day for "missed meal" / consistency purposes. */
export const REQUIRED_MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner']

/**
 * A single food item within a meal. Every nutrient field is optional —
 * quick logging should not require filling out macros. Future integrations
 * (barcode scan, photo log, external health apps) populate these same
 * fields automatically; nothing about this shape is manual-entry-specific.
 */
export interface FoodEntry {
  id: string
  name?: string
  proteinGrams?: number
  carbsGrams?: number
  fatGrams?: number
  calories?: number
  notes?: string
}

/** Where a food entry's data originated — mirrors `WorkoutActivityIntegration.source`. */
export const NUTRITION_ENTRY_SOURCES = [
  'manual',
  'barcode_scan',
  'photo_log',
  'apple_health',
  'google_health_connect',
  'myfitnesspal',
  'macrofactor',
] as const
export type NutritionEntrySource = (typeof NUTRITION_ENTRY_SOURCES)[number]

/** Extension point for future health-platform sync — unused until integrations ship. */
export interface NutritionIntegration {
  source?: NutritionEntrySource
  externalEntryId?: string | null
  lastSyncedAt?: string | null
  syncToken?: string | null
}

/**
 * A logged meal — the Hero Activity record for Nutrition, following the
 * same `ActivityBase` shape as `WorkoutActivity` / `PerformanceAssessmentActivity`.
 * See docs/ACTIVITIES.md and docs/NUTRITION.md.
 */
export interface MealActivity extends ActivityBase {
  kind: 'nutrition'
  /** Always null in this phase — meal logging does not resolve quests or grant rewards. */
  /** Quest auto-completed when this meal was logged (breakfast/lunch/dinner/vitamins-protein). */
  questId: string | null
  mealType: MealType
  foodEntries: FoodEntry[]
  notes?: string
  /** Reserved for future macro/micronutrient tracking, meal plans, etc. */
  integration?: NutritionIntegration
}

/** Daily nutrition goals. Configurable — never hardcoded into logic/UI. */
export interface NutritionTargets {
  proteinGrams: number
  calories: number
  /** Placeholder — no water intake logging exists yet. */
  waterMl: number | null
}

export interface NutritionState {
  schemaVersion: number
  targets: NutritionTargets
  activities: MealActivity[]
}
