import type { GameEvent } from '@/types/event'
import type { HeroStats, StatKey } from '@/types/hero'

export const SUMMARY_PERIODS = ['daily'] as const

export type SummaryPeriod = (typeof SUMMARY_PERIODS)[number]

export interface SummaryStatGrowth {
  stat: StatKey
  amount: number
}

export interface SummaryQuestCategoryProgress {
  completed: number
  total: number
}

export interface SummaryQuestBreakdown {
  nonNegotiable: SummaryQuestCategoryProgress
  dailyBonus: SummaryQuestCategoryProgress
  weekly: SummaryQuestCategoryProgress
  weeklyBonus: SummaryQuestCategoryProgress
}

export interface SummaryTomorrowPreview {
  currentStreak: number
  /** Non-negotiable quest names required on the next calendar day (weekday/weekend-aware). */
  objectives: string[]
  /** Weekly quests still `available` as of this summary. */
  weeklyRemaining: string[]
  /** Locked unlock names with the fewest unmet requirements, closest to unlocking. */
  closeUnlocks: string[]
}

/**
 * Generic result shape produced by the summary pipeline for any period.
 * `'daily'` is the only period implemented today (see
 * `features/summary/dailySummaryLogic.ts`), but nothing here is named or
 * shaped around "day" specifically — a future weekly/monthly generator
 * would populate this exact same interface (just with `period`/`periodKey`
 * describing a week/month instead), so `DailySummaryModal` and friends never
 * need to change to support them.
 */
export interface SummarySnapshot {
  period: SummaryPeriod
  /** Calendar key identifying which period this covers (`YYYY-MM-DD` for `'daily'`). */
  periodKey: string
  heroName: string
  heroTitle: string
  heroLevel: number
  /** Earned during this period — a delta off `DayStartHeroSnapshot`, not a running total. */
  xpEarned: number
  goldEarned: number
  quests: SummaryQuestBreakdown
  /** Only stats that increased during this period — never zero/unchanged entries. */
  statGrowth: SummaryStatGrowth[]
  /** This period's slice of the internal event log, chronological (oldest first). */
  events: GameEvent[]
  streak: number
  reflection: string
  tomorrowPreview: SummaryTomorrowPreview
}

/**
 * Hero baseline captured at the start of each day — the diff basis for
 * "XP/Gold earned" and "stats grown" in a `SummarySnapshot`. Lives outside
 * `Hero` itself since it's bookkeeping for the summary pipeline, not a core
 * hero attribute.
 */
export interface DayStartHeroSnapshot {
  stats: HeroStats
  totalXpEarned: number
  totalGoldEarned: number
}
