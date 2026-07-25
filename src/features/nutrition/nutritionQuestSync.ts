import {
  computeSatisfiedNutritionQuestIds,
  NUTRITION_QUEST_IDS,
} from '@/features/nutrition/nutritionQuestResolution'
import type { NutritionState } from '@/types/nutrition'
import type { QuestState } from '@/types/quest'

/**
 * Reconciles nutrition-driven quest availability after a meal is removed or
 * edited. Sets quests back to `available` when their meal/protein criteria
 * are no longer met. Does not claw back XP/gold already granted — the player
 * keeps rewards from an honest log; deleting the meal simply re-opens the quest.
 */
export function revertNutritionQuestsForDay(
  quests: QuestState[],
  nutrition: NutritionState,
  heroDayKey: string,
): QuestState[] {
  const satisfied = computeSatisfiedNutritionQuestIds(nutrition, heroDayKey)

  return quests.map((quest) => {
    if (!NUTRITION_QUEST_IDS.includes(quest.id as (typeof NUTRITION_QUEST_IDS)[number])) {
      return quest
    }
    if (quest.status !== 'completed') return quest
    if (satisfied.has(quest.id)) return quest

    return {
      ...quest,
      status: 'available' as const,
      completedAt: null,
      completionGrade: null,
    }
  })
}
