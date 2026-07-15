import type { StatRewards } from '@/types/hero'

export const QUEST_CATEGORIES = [
  'dailyCore',
  'dailyBonus',
  'weekly',
  'weeklyBonus',
  'special',
] as const

export type QuestCategory = (typeof QUEST_CATEGORIES)[number]

export interface QuestDefinition {
  id: string
  name: string
  description: string
  category: QuestCategory
  xpReward: number
  currencyReward: number
  statRewards: StatRewards
}

export interface QuestState {
  id: string
  completed: boolean
}
