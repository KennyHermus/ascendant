import type { StatRewards } from '@/types/hero'

export const QUEST_CATEGORIES = [
  'nonNegotiable',
  'dailyBonus',
  'weekly',
  'weeklyBonus',
  'special',
] as const

export type QuestCategory = (typeof QUEST_CATEGORIES)[number]

export const NON_NEGOTIABLE_SUBCATEGORIES = [
  'morningRoutine',
  'nutrition',
  'eveningRoutine',
] as const

export type NonNegotiableSubcategory =
  (typeof NON_NEGOTIABLE_SUBCATEGORIES)[number]

export const QUEST_STATUSES = ['available', 'completed', 'missed'] as const

export type QuestStatus = (typeof QUEST_STATUSES)[number]

/**
 * Optional deadline for a quest.
 * targetTime is local 24-hour time ("HH:mm"). graceMinutes extends the
 * completable window past targetTime before the quest becomes Missed.
 *
 * A targetTime of "00:00" is treated as "end of the current day" (i.e. the
 * upcoming midnight) — not needed by any current quest, but kept for future
 * "before midnight" style quests.
 */
export interface QuestTiming {
  targetTime: string
  graceMinutes: number
}

/**
 * Weekday/weekend behavior for a quest. Absent means "every day, no
 * schedule-based change."
 */
export interface QuestSchedule {
  /** Quest does not appear at all on weekends (e.g. Wake Up, Sleep). */
  weekdaysOnly?: boolean
  /** Quest still appears and is completable on weekends, but stops
   * contributing to the streak / its subcategory bonus that day (e.g.
   * Learning/Work becomes an ordinary bonus quest on weekends). */
  streakOnlyOnWeekdays?: boolean
}

export interface QuestDefinition {
  id: string
  name: string
  description: string
  category: QuestCategory
  /** Only meaningful for `nonNegotiable` quests; groups subcategory rewards. */
  subcategory?: NonNegotiableSubcategory
  xpReward: number
  currencyReward: number
  statRewards: StatRewards
  /** Present only for quests with a deadline. Absent quests behave exactly as before. */
  timing?: QuestTiming
  schedule?: QuestSchedule
  /** Whether this quest counts toward the daily streak requirement (subject to `schedule`). */
  contributesToStreak: boolean
  /** Completable for its own reward, but excluded from streak/subcategory completion (e.g. Breakfast). */
  optional?: boolean
}

export interface QuestState {
  id: string
  status: QuestStatus
}
