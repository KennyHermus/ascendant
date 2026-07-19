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
  getPunctualityAnalytics,
  getQuestAnalytics,
  getTimedQuestAnalytics,
  type AnalyticsInput,
} from '@/features/analytics/analyticsLogic'
import {
  buildAnalyticsDashboardModel,
  type AnalyticsDashboardModel,
} from '@/features/analytics/analyticsPresentation'
import {
  buildPeriodChartBundle,
  flattenPeriodChartBundle,
  type PeriodChartBundle,
} from '@/features/analytics/analyticsChartSelectors'
import { buildAllChartSeries, type ChartSeries } from '@/features/analytics/analyticsSeries'
import { getSnapshotCount } from '@/features/history/historyLogic'
import {
  getCurrentGameTime,
  getGameTimeSnapshot,
  subscribeToGameTimeChanges,
} from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'
import type { AnalyticsPeriod, PeriodAnalytics } from '@/types/analytics'
import type { WorkoutActivity } from '@/types/workout'

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
    questHistory: AnalyticsInput['questHistory']
    workout: { activities: WorkoutActivity[] }
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
    questHistory: state.questHistory,
    workoutActivities: state.workout.activities,
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
  getPunctualityAnalytics,
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
  const questHistory = useGameStore((s) => s.questHistory)
  const workout = useGameStore((s) => s.workout)

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
        questHistory,
        workout,
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
    questHistory,
    workout,
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
  const questHistory = useGameStore((s) => s.questHistory)
  const workout = useGameStore((s) => s.workout)

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
        questHistory,
        workout,
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
    questHistory,
    workout,
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

/** Chart-ready series from History snapshots (lifetime, unfiltered — DevTools legacy). */
export function useChartSeries(): ChartSeries[] {
  const history = useGameStore((s) => s.history)
  return useMemo(
    () => buildAllChartSeries(history.dailySnapshots),
    [history],
  )
}

/** Period-filtered ChartSeries bundle for charts and DevTools. */
export function usePeriodChartBundle(period: AnalyticsPeriod): PeriodChartBundle {
  const now = useAnalyticsClock()
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const questHistory = useGameStore((s) => s.questHistory)
  const workout = useGameStore((s) => s.workout)

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
        questHistory,
        workout,
      },
      now,
    )
    return buildPeriodChartBundle(input, period)
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
    questHistory,
    workout,
  ])
}

export { buildPeriodChartBundle, flattenPeriodChartBundle }

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
