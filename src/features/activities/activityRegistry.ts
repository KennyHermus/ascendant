import type { ActivityKind } from '@/types/activity'
import { NUTRITION_QUEST_IDS } from '@/features/nutrition/nutritionQuestResolution'

/** Quest ids completed through activity flows — not the generic Complete button. */
export const ACTIVITY_DRIVEN_QUEST_IDS = new Set([
  'workout',
  'core',
  'rehab',
  'morning-walk',
  'evening-walk',
  ...NUTRITION_QUEST_IDS,
])

const WORKOUT_DRIVEN_QUEST_IDS = new Set([
  'workout',
  'core',
  'rehab',
  'morning-walk',
  'evening-walk',
])

export function isActivityDrivenQuest(questId: string): boolean {
  return ACTIVITY_DRIVEN_QUEST_IDS.has(questId)
}

export function isNutritionDrivenQuest(questId: string): boolean {
  return NUTRITION_QUEST_IDS.includes(questId as (typeof NUTRITION_QUEST_IDS)[number])
}

export function isWorkoutDrivenQuest(questId: string): boolean {
  return WORKOUT_DRIVEN_QUEST_IDS.has(questId)
}

export function activityKindForQuest(questId: string): ActivityKind | null {
  if (WORKOUT_DRIVEN_QUEST_IDS.has(questId)) return 'workout'
  if (isNutritionDrivenQuest(questId)) return 'nutrition'
  return null
}

export function activityPanelLabelForQuest(questId: string): string | null {
  const kind = activityKindForQuest(questId)
  if (kind === 'workout') return 'Use Workout panel'
  if (kind === 'nutrition') return 'Use Nutrition panel'
  return null
}
