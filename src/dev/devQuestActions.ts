import type { QuestState } from '@/types/quest'

/**
 * Testing-only reset: returns every quest to `available`, including
 * `special` quests, which the normal daily/weekly reset pipeline
 * (`resetQuestsForPeriod`) deliberately never touches. Kept out of
 * `questLogic.ts` so this shortcut can never be reached from production
 * game logic.
 */
export function resetAllQuestsForTesting(quests: QuestState[]): QuestState[] {
  return quests.map((quest) => ({ ...quest, status: 'available' }))
}
