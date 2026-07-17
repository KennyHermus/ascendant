import { useCallback, useMemo, useSyncExternalStore, useState } from 'react'

import { QUEST_DEFINITIONS } from '@/data/quests'
import { selectAnalyticsInput } from '@/features/analytics/analyticsSelectors'
import {
  buildQuestChartBundle,
  type QuestChartBundle,
} from '@/features/questExplorer/questChartSelectors'
import {
  getAllQuestExplorerEntries,
  getQuestPerformanceStats,
  searchQuestExplorerEntries,
  type QuestExplorerEntry,
} from '@/features/questExplorer/questAnalyticsLogic'
import {
  getGameTimeSnapshot,
  subscribeToGameTimeChanges,
} from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { QuestDefinition } from '@/types/quest'

function useAnalyticsClock(): Date {
  return useSyncExternalStore(
    subscribeToGameTimeChanges,
    getGameTimeSnapshot,
    getGameTimeSnapshot,
  )
}

function useQuestExplorerInput() {
  const now = useAnalyticsClock()
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const questHistory = useGameStore((s) => s.questHistory)

  return useMemo(
    () =>
      selectAnalyticsInput(
        {
          hero,
          currentStreak,
          history,
          events,
          quests,
          achievements,
          dayStartHeroSnapshot,
          questHistory,
        },
        now,
      ),
    [
      now,
      hero,
      currentStreak,
      history,
      events,
      quests,
      achievements,
      dayStartHeroSnapshot,
      questHistory,
    ],
  )
}

export function useQuestExplorerEntries(
  period: AnalyticsPeriod,
  query: string,
): QuestExplorerEntry[] {
  const input = useQuestExplorerInput()
  return useMemo(() => {
    const entries = getAllQuestExplorerEntries(input, period)
    return searchQuestExplorerEntries(entries, query)
  }, [input, period, query])
}

export function useQuestPerformanceStats(
  questId: string | null,
  period: AnalyticsPeriod,
) {
  const input = useQuestExplorerInput()
  return useMemo(() => {
    if (!questId) return null
    return getQuestPerformanceStats(input, questId, period)
  }, [input, questId, period])
}

export function useQuestChartBundle(
  questId: string | null,
  period: AnalyticsPeriod,
): QuestChartBundle | null {
  const input = useQuestExplorerInput()
  return useMemo(() => {
    if (!questId) return null
    return buildQuestChartBundle(input, questId, period)
  }, [input, questId, period])
}

export function useSelectedQuestDefinition(
  questId: string | null,
): QuestDefinition | undefined {
  return useMemo(
    () => QUEST_DEFINITIONS.find((d) => d.id === questId),
    [questId],
  )
}

/** Single source of truth for Quest Explorer selection + period/filter state. */
export function useQuestExplorerState(defaultQuestId?: string) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')
  const [query, setQuery] = useState('')
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(
    defaultQuestId ?? QUEST_DEFINITIONS[0]?.id ?? null,
  )

  const allEntries = useQuestExplorerEntries(period, '')
  const filteredEntries = useQuestExplorerEntries(period, query)

  const selectQuest = useCallback((questId: string) => {
    setSelectedQuestId(questId)
  }, [])

  const selectedDefinition = useSelectedQuestDefinition(selectedQuestId)

  return {
    period,
    setPeriod,
    query,
    setQuery,
    selectedQuestId,
    selectQuest,
    selectedDefinition,
    allEntries,
    filteredEntries,
  }
}
