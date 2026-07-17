import { useMemo, useSyncExternalStore } from 'react'

import { QUEST_DEFINITIONS } from '@/data/quests'
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions'
import {
  getAchievementAnalytics,
  getAnalyticsForPeriod,
  getFullAnalytics,
  getHeroAnalytics,
  getHistoryAnalytics,
  getProgressAnalytics,
  getQuestAnalytics,
  getTimedQuestAnalytics,
  type AnalyticsInput,
} from '@/features/analytics/analyticsLogic'
import {
  buildAnalyticsDashboardModel,
  type AnalyticsDashboardModel,
} from '@/features/analytics/analyticsPresentation'
import { buildAllChartSeries } from '@/features/analytics/analyticsSeries'
import { getSnapshotCount } from '@/features/history/historyLogic'
import {
  getCurrentGameTime,
  getGameTimeSnapshot,
  subscribeToGameTimeChanges,
} from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'
import type { AnalyticsPeriod, PeriodAnalytics } from '@/types/analytics'
import type { ChartSeries } from '@/features/analytics/analyticsSeries'

/** Keeps period bounds aligned with simulated / real application time. */
function useAnalyticsClock(): Date {
  const snapshot = useSyncExternalStore(
    subscribeToGameTimeChanges,
    getGameTimeSnapshot,
    getGameTimeSnapshot,
  )
  return snapshot
}

/**
 * Assembles a read-only `AnalyticsInput` from the current game store +
 * static definitions. Pure regarding game state — never writes.
 */
export function selectAnalyticsInput(
  state: {
    hero: AnalyticsInput['hero']
    currentStreak: number
    history: AnalyticsInput['history']
    events: AnalyticsInput['events']
    quests: AnalyticsInput['quests']
    achievements: AnalyticsInput['achievements']
    dayStartHeroSnapshot: AnalyticsInput['dayStartHeroSnapshot']
  },
  now: Date = getCurrentGameTime(),
): AnalyticsInput {
  return {
    hero: state.hero,
    currentStreak: state.currentStreak,
    history: state.history,
    events: state.events,
    quests: state.quests,
    questDefinitions: QUEST_DEFINITIONS,
    achievementDefinitions: ACHIEVEMENT_DEFINITIONS,
    achievements: state.achievements,
    dayStartHeroSnapshot: state.dayStartHeroSnapshot,
    now,
  }
}

export {
  getAchievementAnalytics,
  getAnalyticsForPeriod,
  getFullAnalytics,
  getHeroAnalytics,
  getHistoryAnalytics,
  getProgressAnalytics,
  getQuestAnalytics,
  getTimedQuestAnalytics,
}

/**
 * React selector: memoizes the full analytics bundle against the store
 * slices Analytics actually reads. Prefer this (or `usePeriodAnalytics`)
 * from UI / DevTools instead of recomputing on every render.
 */
export function useFullAnalytics() {
  const now = useAnalyticsClock()
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)

  return useMemo(() => {
    const input = selectAnalyticsInput(
      {
        hero,
        currentStreak,
        history,
        events,
        quests,
        achievements,
        dayStartHeroSnapshot,
      },
      now,
    )
    return getFullAnalytics(input)
  }, [
    now,
    hero,
    currentStreak,
    history,
    events,
    quests,
    achievements,
    dayStartHeroSnapshot,
  ])
}

export function usePeriodAnalytics(period: AnalyticsPeriod): PeriodAnalytics {
  const now = useAnalyticsClock()
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)

  return useMemo(() => {
    const input = selectAnalyticsInput(
      {
        hero,
        currentStreak,
        history,
        events,
        quests,
        achievements,
        dayStartHeroSnapshot,
      },
      now,
    )
    return getAnalyticsForPeriod(input, period)
  }, [
    period,
    now,
    hero,
    currentStreak,
    history,
    events,
    quests,
    achievements,
    dayStartHeroSnapshot,
  ])
}

/**
 * Dashboard view-model for a period. Components render this DTO only —
 * no Engine math inside JSX.
 */
export function useAnalyticsDashboardModel(
  period: AnalyticsPeriod,
): AnalyticsDashboardModel {
  const analytics = usePeriodAnalytics(period)
  return useMemo(() => buildAnalyticsDashboardModel(analytics), [analytics])
}

/** Chart-ready series from History snapshots (for DevTools / future Charts). */
export function useChartSeries(): ChartSeries[] {
  const history = useGameStore((s) => s.history)
  return useMemo(
    () => buildAllChartSeries(history.dailySnapshots),
    [history],
  )
}

/** Lightweight counts for DevTools / diagnostics without full recompute. */
export function useAnalyticsDiagnostics() {
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)

  return useMemo(
    () => ({
      snapshotCount: getSnapshotCount(history),
      eventCount: events.length,
    }),
    [history, events],
  )
}
