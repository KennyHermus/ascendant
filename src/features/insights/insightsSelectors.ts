import { useMemo, useSyncExternalStore } from 'react'

import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import { selectAnalyticsInput } from '@/features/analytics/analyticsSelectors'
import {
  countInsights,
  generateFullInsights,
  generateInsightsForPeriod,
} from '@/features/insights/insightsLogic'
import {
  buildInsightsDashboardModel,
  type InsightsDashboardModel,
} from '@/features/insights/insightsPresentation'
import {
  getCurrentGameTime,
  getGameTimeSnapshot,
  subscribeToGameTimeChanges,
} from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { PeriodInsights } from '@/types/insights'

function useInsightsClock(): Date {
  return useSyncExternalStore(
    subscribeToGameTimeChanges,
    getGameTimeSnapshot,
    getGameTimeSnapshot,
  )
}

export {
  countInsights,
  generateFullInsights,
  generateInsightsForPeriod,
  selectAnalyticsInput,
}

export function usePeriodInsights(period: AnalyticsPeriod): PeriodInsights {
  const now = useInsightsClock()
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const questHistory = useGameStore((s) => s.questHistory)
  const workout = useGameStore((s) => s.workout)
  const performance = useGameStore((s) => s.performance)

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
        performance,
      },
      now,
    )
    return generateInsightsForPeriod(input, period)
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
    performance,
  ])
}

export function useFullInsights() {
  const now = useInsightsClock()
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const questHistory = useGameStore((s) => s.questHistory)
  const workout = useGameStore((s) => s.workout)
  const performance = useGameStore((s) => s.performance)

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
        performance,
      },
      now,
    )
    return generateFullInsights(input)
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
    performance,
  ])
}

export function useInsightsDashboardModel(
  period: AnalyticsPeriod,
): InsightsDashboardModel {
  const bundle = usePeriodInsights(period)
  return useMemo(() => buildInsightsDashboardModel(bundle), [bundle])
}

/** DevTools: assemble Insights from store slices without React hooks. */
export function selectInsightsBundle(
  state: {
    hero: AnalyticsInput['hero']
    currentStreak: number
    history: AnalyticsInput['history']
    events: AnalyticsInput['events']
    quests: AnalyticsInput['quests']
    achievements: AnalyticsInput['achievements']
    dayStartHeroSnapshot: AnalyticsInput['dayStartHeroSnapshot']
    questHistory: AnalyticsInput['questHistory']
    workout: { activities: import('@/types/workout').WorkoutActivity[] }
    performance: AnalyticsInput['performance']
  },
  period: AnalyticsPeriod,
  now: Date = getCurrentGameTime(),
): PeriodInsights {
  return generateInsightsForPeriod(selectAnalyticsInput(state, now), period)
}
