import { useMemo } from 'react'

import { QUEST_DEFINITIONS } from '@/data/quests'
import { getNutritionAnalytics, type NutritionAnalytics } from '@/features/nutrition/nutritionAnalyticsLogic'
import type { NutritionAnalyticsInput } from '@/features/nutrition/nutritionAnalyticsInput'
import { buildNutritionChartBundle, type NutritionChartBundle } from '@/features/nutrition/nutritionChartSelectors'
import { getDailyNutritionSummary, type DailyNutritionSummary } from '@/features/nutrition/nutritionDashboardLogic'
import { getActiveHeroDayKey } from '@/lib/timeService'
import { useGameStore } from '@/store/gameStore'
import type { AnalyticsPeriod } from '@/types/analytics'
import { useGameTime } from '@/lib/useGameTime'

/** Today's Daily Nutrition Summary — updates live as meals are logged. */
export function useTodayNutritionSummary(): DailyNutritionSummary {
  const nutrition = useGameStore((s) => s.nutrition)
  const now = useGameTime()
  const heroDayKey = getActiveHeroDayKey(now)

  return useMemo(
    () => getDailyNutritionSummary(nutrition, heroDayKey),
    [nutrition, heroDayKey],
  )
}

/** Daily Nutrition Summary for an arbitrary Hero Day (e.g. from History navigation). */
export function useNutritionSummaryForDay(heroDayKey: string): DailyNutritionSummary {
  const nutrition = useGameStore((s) => s.nutrition)
  return useMemo(
    () => getDailyNutritionSummary(nutrition, heroDayKey),
    [nutrition, heroDayKey],
  )
}

/** Single source of truth for `NutritionAnalyticsInput` — mirrors `useWorkoutAnalyticsInput`. */
export function useNutritionAnalyticsInput(): NutritionAnalyticsInput {
  const nutrition = useGameStore((s) => s.nutrition)
  const now = useGameTime()

  return useMemo(
    () => ({ nutrition, questDefinitions: QUEST_DEFINITIONS, now }),
    [nutrition, now],
  )
}

/** Period-scoped Nutrition Analytics — protein/calorie trends, streaks, adherence. */
export function useNutritionAnalytics(period: AnalyticsPeriod): NutritionAnalytics {
  const input = useNutritionAnalyticsInput()
  return useMemo(() => getNutritionAnalytics(input, period), [input, period])
}

/** Chart-ready protein/calorie trend series for a period. */
export function useNutritionChartBundle(period: AnalyticsPeriod): NutritionChartBundle {
  const input = useNutritionAnalyticsInput()
  return useMemo(() => buildNutritionChartBundle(input, period), [input, period])
}
