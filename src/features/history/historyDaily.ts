import { completionRate } from '@/features/analytics/analyticsHelpers'
import { formatChartDateLabel } from '@/features/analytics/chartPresentation'
import { getEventsForPeriod, getSnapshot } from '@/features/history/historyLogic'
import { formatDateKey } from '@/lib/storage'
import type { AchievementDefinition } from '@/types/achievement'
import type { GameEvent } from '@/types/event'
import type { HeroHistory } from '@/types/history'
import type { DailyHistoryDetail } from '@/types/historyUi'
import type { SummarySnapshot } from '@/types/summary'
import type { UnlockDefinition } from '@/types/unlock'

export interface BuildDailyHistoryInput {
  date: string
  todayKey: string
  history: HeroHistory
  events: GameEvent[]
  dailySummary: SummarySnapshot | null
  achievementDefinitions: AchievementDefinition[]
  unlockDefinitions: UnlockDefinition[]
}

export function buildDailyHistoryDetail(input: BuildDailyHistoryInput): DailyHistoryDetail {
  const {
    date,
    todayKey,
    history,
    events,
    dailySummary,
    achievementDefinitions,
    unlockDefinitions,
  } = input

  const snapshot = getSnapshot(history, date) ?? null
  const dayEvents = getEventsForPeriod(events, date).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  const completedQuests = uniqueQuestEntries(
    dayEvents.filter((e) => e.type === 'QUEST_COMPLETED'),
  )
  const missedQuests = uniqueQuestEntries(
    dayEvents.filter((e) => e.type === 'QUEST_FAILED'),
  )

  const achievementMap = new Map(achievementDefinitions.map((d) => [d.id, d]))
  const unlockMap = new Map(unlockDefinitions.map((d) => [d.id, d]))

  const achievements = (snapshot?.achievementIds ?? []).map((id) => {
    const def = achievementMap.get(id)
    return { id, name: def?.name ?? id, icon: def?.icon }
  })

  const unlocks = (snapshot?.unlockIds ?? []).map((id) => {
    const def = unlockMap.get(id)
    return { id, name: def?.name ?? id }
  })

  const summary =
    dailySummary && dailySummary.periodKey === date ? dailySummary : null

  const questsCompleted = snapshot?.questsCompleted ?? completedQuests.length
  const questsMissed = snapshot?.questsMissed ?? missedQuests.length

  return {
    date,
    dateLabel: formatChartDateLabel(date),
    snapshot,
    isToday: date === todayKey,
    isFuture: date > todayKey,
    level: snapshot?.level ?? null,
    currentXp: snapshot?.currentXp ?? null,
    gold: snapshot?.gold ?? null,
    stats: snapshot?.stats ?? null,
    currentStreak: snapshot?.currentStreak ?? null,
    xpEarned: snapshot?.xpEarned ?? null,
    goldEarned: snapshot?.goldEarned ?? null,
    questsCompleted,
    questsMissed,
    completionRate: completionRate(questsCompleted, questsMissed),
    completedQuests,
    missedQuests,
    achievements,
    unlocks,
    events: dayEvents,
    summary,
  }
}

function uniqueQuestEntries(
  events: GameEvent[],
): { questId: string; questName: string }[] {
  const seen = new Set<string>()
  const entries: { questId: string; questName: string }[] = []

  for (const event of events) {
    if (event.type !== 'QUEST_COMPLETED' && event.type !== 'QUEST_FAILED') continue
    if (seen.has(event.questId)) continue
    seen.add(event.questId)
    entries.push({ questId: event.questId, questName: event.questName })
  }

  return entries
}

/** Resolve unlock day from History snapshots, falling back to achievement `unlockedAt`. */
export function findAchievementUnlockDay(
  history: HeroHistory,
  achievementId: string,
  unlockedAt: string | null,
): string | undefined {
  const snapshot = history.dailySnapshots.find((entry) =>
    entry.achievementIds.includes(achievementId),
  )
  if (snapshot) return snapshot.date
  if (unlockedAt) return formatDateKey(new Date(unlockedAt))
  return undefined
}
