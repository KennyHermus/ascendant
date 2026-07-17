import type { GameEvent } from '@/types/event'
import type { StatKey } from '@/types/hero'
import type { DailySnapshot } from '@/types/history'
import type { SummarySnapshot } from '@/types/summary'

/** Timeline filter tabs — maps to `GameEvent` type groupings. */
export const TIMELINE_FILTER_CATEGORIES = [
  'all',
  'progress',
  'quests',
  'achievements',
  'unlocks',
] as const

export type TimelineFilterCategory = (typeof TIMELINE_FILTER_CATEGORIES)[number]

export interface TimelineDayGroup {
  date: string
  dateLabel: string
  events: GameEvent[]
  snapshot?: DailySnapshot
}

export interface CalendarDayCell {
  date: string
  completionRate: number | null
  hasSnapshot: boolean
  isFuture: boolean
  isToday: boolean
}

export interface CalendarWeekColumn {
  weekKey: string
  days: CalendarDayCell[]
}

export interface DailyQuestEntry {
  questId: string
  questName: string
}

export interface DailyNamedEntry {
  id: string
  name: string
  icon?: string
}

/** Presentation model for the Daily History Browser — built from History + events. */
export interface DailyHistoryDetail {
  date: string
  dateLabel: string
  snapshot: DailySnapshot | null
  isToday: boolean
  isFuture: boolean
  level: number | null
  currentXp: number | null
  gold: number | null
  stats: Record<StatKey, number> | null
  currentStreak: number | null
  xpEarned: number | null
  goldEarned: number | null
  questsCompleted: number
  questsMissed: number
  completionRate: number | null
  completedQuests: DailyQuestEntry[]
  missedQuests: DailyQuestEntry[]
  achievements: DailyNamedEntry[]
  unlocks: DailyNamedEntry[]
  events: GameEvent[]
  summary: SummarySnapshot | null
}
