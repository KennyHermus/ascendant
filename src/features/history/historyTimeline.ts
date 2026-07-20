import { QUEST_DEFINITIONS } from '@/data/quests'
import { isPlayerVisibleQuestFailedEvent } from '@/features/quests/questMissPolicy'
import { completionRate } from '@/features/analytics/analyticsHelpers'
import { formatChartDateLabel } from '@/features/analytics/chartPresentation'
import {
  eventMatchesSearch,
  eventMatchesTimelineCategory,
} from '@/features/history/historyPresentation'
import { getEventsForPeriod } from '@/features/history/historyLogic'
import { formatDateKey } from '@/lib/storage'
import type { GameEvent } from '@/types/event'
import type { HeroHistory } from '@/types/history'
import type { TimelineDayGroup, TimelineFilterCategory } from '@/types/historyUi'

export interface BuildTimelineInput {
  history: HeroHistory
  events: GameEvent[]
  filter: TimelineFilterCategory
  searchQuery: string
}

function getEventPeriodKey(event: GameEvent): string {
  if (event.type === 'QUEST_FAILED' && event.periodKey) {
    return event.periodKey
  }
  if (event.type === 'QUEST_COMPLETED') {
    return event.heroDayKey
  }
  if (event.type === 'WORKOUT_COMPLETED') {
    return event.heroDayKey
  }
  if (event.type === 'PERSONAL_RECORD_ACHIEVED') {
    return event.heroDayKey
  }
  return formatDateKey(new Date(event.timestamp))
}

function collectTimelineDates(history: HeroHistory, events: GameEvent[]): string[] {
  const dates = new Set<string>()
  for (const snapshot of history.dailySnapshots) {
    dates.add(snapshot.date)
  }
  for (const event of events) {
    dates.add(getEventPeriodKey(event))
  }
  return [...dates].sort((a, b) => b.localeCompare(a))
}

function filterEvents(
  events: GameEvent[],
  filter: TimelineFilterCategory,
  searchQuery: string,
): GameEvent[] {
  return events.filter(
    (event) =>
      isPlayerVisibleQuestFailedEvent(event, QUEST_DEFINITIONS) &&
      eventMatchesTimelineCategory(event, filter) &&
      eventMatchesSearch(event, searchQuery),
  )
}

/**
 * Reverse-chronological timeline grouped by quest-day.
 * Includes snapshot-only days (empty event list) so calendar cross-nav has a feed anchor.
 */
export function buildTimelineGroups(input: BuildTimelineInput): TimelineDayGroup[] {
  const { history, events, filter, searchQuery } = input
  const dates = collectTimelineDates(history, events)
  const hasSearch = searchQuery.trim().length > 0
  const groups: TimelineDayGroup[] = []

  for (const date of dates) {
    const dayEvents = getEventsForPeriod(events, date)
    const filtered = filterEvents(dayEvents, filter, searchQuery)
    const snapshot = history.dailySnapshots.find((entry) => entry.date === date)

    if (filtered.length > 0) {
      groups.push({
        date,
        dateLabel: formatChartDateLabel(date),
        events: [...filtered].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
        snapshot,
      })
      continue
    }

    if (hasSearch || filter !== 'all') continue
    if (!snapshot) continue

    groups.push({
      date,
      dateLabel: formatChartDateLabel(date),
      events: [],
      snapshot,
    })
  }

  return groups
}

export function getSnapshotDaySummary(snapshot: {
  questsCompleted: number
  questsMissed: number
  xpEarned: number
}): string {
  const rate = completionRate(snapshot.questsCompleted, snapshot.questsMissed)
  const rateLabel = rate !== null ? `${Math.round(rate * 100)}% complete` : 'No quests'
  const xpLabel = snapshot.xpEarned > 0 ? ` · +${snapshot.xpEarned} XP` : ''
  return `${snapshot.questsCompleted} completed · ${snapshot.questsMissed} missed · ${rateLabel}${xpLabel}`
}
