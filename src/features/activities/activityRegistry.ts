import type { ActivityKind } from '@/types/activity'

/** Quest ids completed through activity flows — not the generic Complete button. */
export const ACTIVITY_DRIVEN_QUEST_IDS = new Set([
  'workout',
  'core',
  'rehab',
  'morning-walk',
  'evening-walk',
])

export function isActivityDrivenQuest(questId: string): boolean {
  return ACTIVITY_DRIVEN_QUEST_IDS.has(questId)
}

export function activityKindForQuest(questId: string): ActivityKind | null {
  if (ACTIVITY_DRIVEN_QUEST_IDS.has(questId)) return 'workout'
  return null
}
