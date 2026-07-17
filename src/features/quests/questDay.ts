import { getActiveHeroDayKey, addHeroDays, getHeroDayEnd } from '@/lib/timeService'
import { getCurrentGameTime } from '@/lib/gameTime'
import type { QuestDefinition } from '@/types/quest'

/**
 * When the Hero Day `heroDayKey` ends (exclusive — start of next Hero Day).
 * Replaces the prior Sleep-grace deadline model with a centralized 5:00 AM boundary.
 */
export function getHeroDayEndDeadline(
  heroDayKey: string,
): Date {
  return getHeroDayEnd(heroDayKey)
}

/** @deprecated Use `addHeroDays`. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  return addHeroDays(dateKey, days)
}

/**
 * The Hero Day key currently in play (rolls at 5:00 AM boundary).
 * All daily quests, streaks, history, and analytics consume this key.
 */
export function getActiveQuestDayKey(
  _definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): string {
  void _definitions
  return getActiveHeroDayKey(now)
}

/** @deprecated Alias — prefer `getHeroDayEndDeadline`. */
export function getStreakDayEndDeadline(
  dateKey: string,
  _definitions: QuestDefinition[],
): Date {
  void _definitions
  return getHeroDayEndDeadline(dateKey)
}

export { parseCalendarDateKey as parseDateKeyForQuestDay } from '@/lib/timeService'
