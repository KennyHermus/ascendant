import type { NutritionState } from '@/types/nutrition'
import type { QuestDefinition } from '@/types/quest'

/**
 * Read-only inputs the Nutrition Analytics domain needs. Deliberately a
 * narrow subset of the generic `AnalyticsInput` — Nutrition is its own
 * domain (see `docs/NUTRITION.md`) and should not force every Analytics
 * consumer to depend on hero/quest/workout state it doesn't use. Any value
 * shaped like `AnalyticsInput` satisfies this interface structurally, so the
 * core Insights/Analytics Engine can keep passing its full bundle through
 * unchanged.
 */
export interface NutritionAnalyticsInput {
  nutrition: NutritionState
  questDefinitions: QuestDefinition[]
  now: Date
}
