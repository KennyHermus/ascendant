import { computeActivitiesTotals } from '@/features/nutrition/nutritionStatistics'
import type { MealType, NutritionState } from '@/types/nutrition'
import type { QuestDefinition } from '@/types/quest'

/** Quest ids satisfied by logging a meal of the given type. */
export const MEAL_TYPE_QUEST_IDS: Partial<Record<MealType, string>> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
}

export const PROTEIN_TARGET_QUEST_ID = 'vitamins-protein'

export const NUTRITION_QUEST_IDS = [
  'breakfast',
  'lunch',
  'dinner',
  'vitamins-protein',
] as const

export type NutritionQuestId = (typeof NUTRITION_QUEST_IDS)[number]

export function resolveQuestIdsForMealType(mealType: MealType): string[] {
  const questId = MEAL_TYPE_QUEST_IDS[mealType]
  return questId ? [questId] : []
}

/** Which nutrition quests are satisfied by current meal activities on a Hero Day. */
export function computeSatisfiedNutritionQuestIds(
  nutrition: NutritionState,
  heroDayKey: string,
): Set<string> {
  const dayActivities = nutrition.activities.filter(
    (activity) => activity.heroDayKey === heroDayKey,
  )
  const satisfied = new Set<string>()

  for (const activity of dayActivities) {
    for (const questId of resolveQuestIdsForMealType(activity.mealType)) {
      satisfied.add(questId)
    }
  }

  const protein = computeActivitiesTotals(dayActivities).proteinGrams
  if (protein >= nutrition.targets.proteinGrams) {
    satisfied.add(PROTEIN_TARGET_QUEST_ID)
  }

  return satisfied
}

export interface NutritionQuestResolutionResult {
  resolvedQuestIds: string[]
  primaryResolvedQuestId: string | null
}

/**
 * Attempts to complete nutrition quests matched by a newly logged meal and
 * optional protein-target crossing. Already-completed quests are skipped —
 * same contract as `resolveWorkoutQuests`.
 */
export function resolveNutritionQuests(input: {
  mealType: MealType
  proteinTargetJustMet: boolean
  definitions: QuestDefinition[]
  completeQuest: (questId: string) => boolean
}): NutritionQuestResolutionResult {
  const candidateIds = [
    ...resolveQuestIdsForMealType(input.mealType),
    ...(input.proteinTargetJustMet ? [PROTEIN_TARGET_QUEST_ID] : []),
  ]

  const resolvedQuestIds: string[] = []
  for (const questId of candidateIds) {
    if (!input.definitions.some((definition) => definition.id === questId)) continue
    if (input.completeQuest(questId)) {
      resolvedQuestIds.push(questId)
    }
  }

  return {
    resolvedQuestIds,
    primaryResolvedQuestId: resolvedQuestIds[0] ?? null,
  }
}
