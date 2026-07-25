import type { NutritionTargets } from '@/types/nutrition'

/**
 * Default daily Nutrition targets. Purely a starting point — the player
 * can edit these in the Nutrition panel (`updateNutritionTargets`), and
 * they persist independently of this file. Never read these values
 * directly from logic/UI; always go through `GameState.nutrition.targets`.
 */
export const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  proteinGrams: 150,
  calories: 2200,
  waterMl: null,
}
