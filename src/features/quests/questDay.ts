import { questContributesToStreakOn } from '@/features/quests/questSchedule'
import { evaluateQuestTimingForDay } from '@/features/quests/questTiming'
import { getCurrentGameTime } from '@/lib/gameTime'
import { formatDateKey, parseDateKey } from '@/lib/storage'
import type { QuestDefinition } from '@/types/quest'

/**
 * When the calendar day `dateKey` stops being "in play" for streak / daily
 * reset purposes.
 *
 * If any timed Non-Negotiable is required that day (Sleep on weekdays), the
 * day ends at the latest of those quests' grace deadlines (Sleep's
 * 23:45 + 30m → 00:15 the next morning). Otherwise the day ends at midnight
 * at the start of the following calendar day.
 */
export function getStreakDayEndDeadline(
  dateKey: string,
  definitions: QuestDefinition[],
): Date {
  const dayReference = parseDateKey(dateKey)

  let latestDeadline: Date | null = null
  for (const definition of definitions) {
    if (!definition.timing) continue
    if (!questContributesToStreakOn(definition, dayReference)) continue

    const { deadline } = evaluateQuestTimingForDay(
      definition.timing,
      dateKey,
      dayReference,
    )
    if (!latestDeadline || deadline.getTime() > latestDeadline.getTime()) {
      latestDeadline = deadline
    }
  }

  if (latestDeadline) return latestDeadline

  const midnightNextDay = parseDateKey(dateKey)
  midnightNextDay.setHours(0, 0, 0, 0)
  midnightNextDay.setDate(midnightNextDay.getDate() + 1)
  return midnightNextDay
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

/**
 * The quest-day key that is currently "in play".
 *
 * Rolls forward only after the previous calendar day's streak-end deadline
 * (Sleep grace on weekdays — 00:15 next morning; otherwise midnight). This
 * keeps 00:00–00:15 attached to the night that just ended so Sleep can still
 * be completed (or marked missed) before daily reset fires.
 */
export function getActiveQuestDayKey(
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): string {
  const calendarToday = formatDateKey(now)
  const calendarYesterday = addDaysToDateKey(calendarToday, -1)
  const yesterdayEnd = getStreakDayEndDeadline(calendarYesterday, definitions)

  if (now.getTime() < yesterdayEnd.getTime()) {
    return calendarYesterday
  }

  return calendarToday
}
