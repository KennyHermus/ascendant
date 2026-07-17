import { getCurrentGameTime } from '@/lib/gameTime'
import { formatDateKey, parseDateKey } from '@/lib/storage'
import type { Hero } from '@/types/hero'
import { STAT_KEYS } from '@/types/hero'
import type { DailySnapshot, HeroHistory } from '@/types/history'
import { HISTORY_SCHEMA_VERSION } from '@/types/history'

import { getSnapshot, recordDailySnapshot } from './historyLogic'

export interface GenerateSampleHistoryInput {
  history: HeroHistory
  hero: Hero
  /** Number of past days to synthesize (excluding today). */
  days: number
  /** Quest-day key for "today" — sample ends the day before this. */
  todayKey: string
  now?: Date
}

/**
 * DEV-only: backfills synthetic snapshots for testing Hero History UI.
 * Does not overwrite existing dates; skips dates that already have snapshots.
 */
export function generateSampleHistory(input: GenerateSampleHistoryInput): HeroHistory {
  const { hero, days, todayKey, now = getCurrentGameTime() } = input
  let history = input.history

  const today = parseDateKey(todayKey)
  const baseLevel = hero.level
  const baseStats = Object.fromEntries(
    STAT_KEYS.map((key) => [key, hero.stats[key].value]),
  ) as DailySnapshot['stats']

  for (let offset = days; offset >= 1; offset -= 1) {
    const date = formatDateKey(addDays(today, -offset))
    if (getSnapshot(history, date)) continue

    const seed = hashDate(date)
    const totalQuests = 8 + (seed % 4)
    const rate = 0.35 + (seed % 60) / 100
    const questsCompleted = Math.min(totalQuests, Math.round(totalQuests * rate))
    const questsMissed = Math.max(0, totalQuests - questsCompleted)
    const xpEarned = questsCompleted * (12 + (seed % 8))
    const goldEarned = questsCompleted * (3 + (seed % 5))
    const level = Math.max(1, baseLevel - Math.floor(offset / 14))
    const streak = Math.max(0, (seed % 12) - Math.floor(offset / 7))

    const snapshot: DailySnapshot = {
      schemaVersion: HISTORY_SCHEMA_VERSION,
      date,
      finalizedAt: addDays(parseDateKey(date), 1).toISOString(),
      level,
      currentXp: (seed * 17) % 100,
      gold: hero.currency + goldEarned * offset,
      currentStreak: streak,
      longestStreak: Math.max(streak, hero.lifetimeStats.longestStreak),
      questsCompleted,
      questsMissed,
      xpEarned,
      goldEarned,
      stats: Object.fromEntries(
        STAT_KEYS.map((key) => [
          key,
          Math.max(1, baseStats[key] - Math.floor(offset / 21)),
        ]),
      ) as DailySnapshot['stats'],
      achievementIds: [],
      unlockIds: [],
      totalQuestsCompleted: Math.max(
        0,
        hero.lifetimeStats.totalQuestsCompleted - offset * 3,
      ),
      totalXpEarned: Math.max(0, hero.lifetimeStats.totalXpEarned - offset * xpEarned),
      totalGoldEarned: Math.max(
        0,
        hero.lifetimeStats.totalGoldEarned - offset * goldEarned,
      ),
    }

    history = recordDailySnapshot(history, snapshot)
  }

  void now
  return history
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function hashDate(dateKey: string): number {
  let hash = 0
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
  }
  return hash
}
