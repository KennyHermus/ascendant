import type { NonNegotiableSubcategory, QuestCategory } from '@/types/quest'

/** Single source of truth for category display names — used by both the
 * player-facing quest list and the developer bulk-completion tools. */
export const QUEST_CATEGORY_LABELS: Record<QuestCategory, string> = {
  nonNegotiable: 'Non-Negotiables',
  dailyBonus: 'Daily Bonus',
  weekly: 'Weekly Quests',
  weeklyBonus: 'Weekly Bonus',
  special: 'Special Quests',
}

export const SUBCATEGORY_LABELS: Record<NonNegotiableSubcategory, string> = {
  morningRoutine: 'Morning Routine',
  nutrition: 'Nutrition',
  eveningRoutine: 'Evening Routine',
}
