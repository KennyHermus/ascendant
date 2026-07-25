import type { NutritionTargets } from '@/types/nutrition'

/**
 * Default daily Nutrition targets. Purely a starting point — the player
 * can edit these in the Nutrition panel (`updateNutritionTargets`), and
 * they persist independently of this file. Never read these values
 * directly from logic/UI; go through `GameState.fitnessSettings` (synced to
 * `nutrition.targets`). See docs/FITNESS_SETTINGS.md.
 */
export const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  proteinGrams: 150,
  calories: 2200,
  waterMl: null,
}
