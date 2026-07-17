import { questSupportsPlayerMiss } from '@/features/quests/questMissPolicy'
import { getStatValue } from '@/features/hero/heroLogic'
import { getCurrentGameTime } from '@/lib/gameTime'
import { formatDateKey } from '@/lib/storage'
import type { GameEvent } from '@/types/event'
import type { Hero } from '@/types/hero'
import { STAT_KEYS } from '@/types/hero'
import type { DailySnapshot, HeroHistory } from '@/types/history'
import { HISTORY_SCHEMA_VERSION } from '@/types/history'
import type { QuestDefinition, QuestState } from '@/types/quest'
import type { DayStartHeroSnapshot } from '@/types/summary'

export function createEmptyHistory(): HeroHistory {
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    dailySnapshots: [],
  }
}

/** Safe default / merge helper for saves that predate history. */
export function mergeHistory(persisted: HeroHistory | undefined | null): HeroHistory {
  if (!persisted || !Array.isArray(persisted.dailySnapshots)) {
    return createEmptyHistory()
  }

  return {
    schemaVersion: persisted.schemaVersion ?? HISTORY_SCHEMA_VERSION,
    dailySnapshots: [...persisted.dailySnapshots].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  }
}

export function getHistory(history: HeroHistory): HeroHistory {
  return history
}

export function getSnapshot(
  history: HeroHistory,
  date: string,
): DailySnapshot | undefined {
  return history.dailySnapshots.find((snapshot) => snapshot.date === date)
}

export function getLatestSnapshot(history: HeroHistory): DailySnapshot | undefined {
  const { dailySnapshots } = history
  if (dailySnapshots.length === 0) return undefined
  return dailySnapshots[dailySnapshots.length - 1]
}

export function getSnapshotCount(history: HeroHistory): number {
  return history.dailySnapshots.length
}

/**
 * Appends `snapshot` if no snapshot already exists for its `date`.
 * Never overwrites — returns the original history reference when skipped.
 */
export function recordDailySnapshot(
  history: HeroHistory,
  snapshot: DailySnapshot,
): HeroHistory {
  if (history.dailySnapshots.some((entry) => entry.date === snapshot.date)) {
    return history
  }

  const dailySnapshots = [...history.dailySnapshots, snapshot].sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  return {
    ...history,
    schemaVersion: HISTORY_SCHEMA_VERSION,
    dailySnapshots,
  }
}

/** Removes the chronologically latest snapshot. No-op on empty history. */
export function deleteLatestSnapshot(history: HeroHistory): HeroHistory {
  if (history.dailySnapshots.length === 0) return history

  return {
    ...history,
    dailySnapshots: history.dailySnapshots.slice(0, -1),
  }
}

export function resetHistory(): HeroHistory {
  return createEmptyHistory()
}

export interface BuildDailySnapshotInput {
  date: string
  hero: Hero
  quests: QuestState[]
  questDefinitions: QuestDefinition[]
  events: GameEvent[]
  streak: number
  dayStartSnapshot: DayStartHeroSnapshot
  /** Game time when the snapshot is finalized (supports simulated time). */
  now?: Date
}

/**
 * Builds an immutable end-of-day snapshot from the day's final (pre-reset)
 * game state. Pure — does not consult or mutate history. Callers pass the
 * result to `recordDailySnapshot`.
 *
 * Quest completed/missed counts come from quest *status* at finalize time
 * (not the recent-event buffer), so a capped event log cannot under-count.
 * Achievement/unlock id lists are taken from that day's events.
 */
export function buildDailySnapshot(input: BuildDailySnapshotInput): DailySnapshot {
  const {
    date,
    hero,
    quests,
    questDefinitions,
    events,
    streak,
    dayStartSnapshot,
    now = getCurrentGameTime(),
  } = input

  const definitionIds = new Set(questDefinitions.map((d) => d.id))
  const definitionById = new Map(questDefinitions.map((d) => [d.id, d]))
  let questsCompleted = 0
  let questsMissed = 0

  for (const quest of quests) {
    if (!definitionIds.has(quest.id)) continue
    if (quest.status === 'completed') questsCompleted += 1
    else if (quest.status === 'missed') {
      const definition = definitionById.get(quest.id)
      if (definition && questSupportsPlayerMiss(definition)) {
        questsMissed += 1
      }
    }
  }

  const dayEvents = eventsForPeriod(events, date)
  const achievementIds = uniqueIds(
    dayEvents
      .filter((e) => e.type === 'ACHIEVEMENT_UNLOCKED')
      .map((e) => e.achievementId),
  )
  const unlockIds = uniqueIds(
    dayEvents
      .filter((e) => e.type === 'UNLOCK_EARNED')
      .map((e) => e.unlockId),
  )

  const stats = Object.fromEntries(
    STAT_KEYS.map((key) => [key, getStatValue(hero.stats, key)]),
  ) as Record<(typeof STAT_KEYS)[number], number>

  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    date,
    finalizedAt: now.toISOString(),
    level: hero.level,
    currentXp: hero.currentXp,
    gold: hero.currency,
    currentStreak: streak,
    longestStreak: hero.lifetimeStats.longestStreak,
    questsCompleted,
    questsMissed,
    xpEarned: Math.max(
      0,
      hero.lifetimeStats.totalXpEarned - dayStartSnapshot.totalXpEarned,
    ),
    goldEarned: Math.max(
      0,
      hero.lifetimeStats.totalGoldEarned - dayStartSnapshot.totalGoldEarned,
    ),
    stats,
    achievementIds,
    unlockIds,
    totalQuestsCompleted: hero.lifetimeStats.totalQuestsCompleted,
    totalXpEarned: hero.lifetimeStats.totalXpEarned,
    totalGoldEarned: hero.lifetimeStats.totalGoldEarned,
  }
}

/**
 * Events belonging to a quest-day. Prefers `periodKey` on `QUEST_FAILED`
 * (Sleep grace can timestamp on the next calendar morning); other types
 * match by the event timestamp's local date key.
 */
/** Events belonging to a quest-day (exported for Timeline / Daily History). */
export function getEventsForPeriod(events: GameEvent[], periodKey: string): GameEvent[] {
  return events.filter((event) => {
    if (event.type === 'QUEST_FAILED' && event.periodKey) {
      return event.periodKey === periodKey
    }
    return formatDateKey(new Date(event.timestamp)) === periodKey
  })
}

function eventsForPeriod(events: GameEvent[], periodKey: string): GameEvent[] {
  return getEventsForPeriod(events, periodKey)
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}
