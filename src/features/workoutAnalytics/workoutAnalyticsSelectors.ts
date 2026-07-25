import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import { QUEST_DEFINITIONS } from '@/data/quests'
import { ANALYTICS_PERIOD_LABELS } from '@/features/analytics/analyticsPresentation'
import {
  getAllExerciseAnalyticsEntries,
  getExerciseAnalytics,
  searchExerciseAnalyticsEntries,
  type ExerciseAnalyticsEntry,
} from '@/features/workoutAnalytics/exerciseAnalyticsLogic'
import { getWorkoutPrAnalytics, type WorkoutPrAnalytics } from '@/features/workoutAnalytics/prAnalyticsLogic'
import {
  getTrainingDistribution,
  type TrainingDistribution,
} from '@/features/workoutAnalytics/trainingDistributionLogic'
import {
  buildWorkoutAnalyticsChartBundle,
  type WorkoutAnalyticsChartBundle,
} from '@/features/workoutAnalytics/workoutAnalyticsChartSelectors'
import type { WorkoutAnalyticsInput } from '@/features/workoutAnalytics/workoutAnalyticsInput'
import {
  buildWorkoutAnalyticsInsights,
  buildWorkoutAnalyticsRecommendations,
  buildWorkoutDashboardOverviewMetrics,
} from '@/features/workoutAnalytics/workoutAnalyticsPresentation'
import {
  getWorkoutCoachingSummary,
  type WorkoutCoachingSummary,
} from '@/features/workoutAnalytics/workoutCoachingSummaryLogic'
import {
  getWorkoutDashboardOverview,
  type WorkoutDashboardOverview,
} from '@/features/workoutAnalytics/workoutDashboardLogic'
import {
  getAllWorkoutTemplateAnalyticsEntries,
  getWorkoutTemplateAnalytics,
  type WorkoutTemplateAnalyticsEntry,
  type WorkoutTemplateAnalyticsStats,
} from '@/features/workoutAnalytics/workoutTemplateAnalyticsLogic'
import {
  getGameTimeSnapshot,
  subscribeToGameTimeChanges,
} from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { AnalyticsDomainModel } from '@/types/analyticsDomain'

function useAnalyticsClock(): Date {
  return useSyncExternalStore(
    subscribeToGameTimeChanges,
    getGameTimeSnapshot,
    getGameTimeSnapshot,
  )
}

/** Single source of truth for `WorkoutAnalyticsInput` — mirrors `selectAnalyticsInput`. */
export function useWorkoutAnalyticsInput(): WorkoutAnalyticsInput {
  const now = useAnalyticsClock()
  const workout = useGameStore((s) => s.workout)
  const performance = useGameStore((s) => s.performance)
  const coaching = useGameStore((s) => s.coaching)

  return useMemo(
    () => ({
      workoutActivities: workout.activities,
      performance,
      coaching,
      questDefinitions: QUEST_DEFINITIONS,
      now,
    }),
    [workout, performance, coaching, now],
  )
}

export function useWorkoutDashboardOverview(period: AnalyticsPeriod): WorkoutDashboardOverview {
  const input = useWorkoutAnalyticsInput()
  return useMemo(() => getWorkoutDashboardOverview(input, period), [input, period])
}

export function useExerciseAnalyticsEntries(
  period: AnalyticsPeriod,
  query: string,
): ExerciseAnalyticsEntry[] {
  const input = useWorkoutAnalyticsInput()
  return useMemo(() => {
    const entries = getAllExerciseAnalyticsEntries(input, period).sort(
      (a, b) =>
        b.stats.timesPerformed - a.stats.timesPerformed ||
        a.exercise.name.localeCompare(b.exercise.name),
    )
    return searchExerciseAnalyticsEntries(entries, query)
  }, [input, period, query])
}

export function useExerciseAnalyticsDetail(
  exerciseId: string | null,
  period: AnalyticsPeriod,
) {
  const input = useWorkoutAnalyticsInput()
  return useMemo(() => {
    if (!exerciseId) return null
    return getExerciseAnalytics(input, exerciseId, period)
  }, [input, exerciseId, period])
}

export function useWorkoutTemplateAnalyticsEntries(
  period: AnalyticsPeriod,
): WorkoutTemplateAnalyticsEntry[] {
  const input = useWorkoutAnalyticsInput()
  return useMemo(
    () =>
      getAllWorkoutTemplateAnalyticsEntries(input, period).sort(
        (a, b) => b.stats.timesCompleted - a.stats.timesCompleted,
      ),
    [input, period],
  )
}

export function useWorkoutTemplateAnalyticsDetail(
  templateId: string | null,
  period: AnalyticsPeriod,
): WorkoutTemplateAnalyticsStats | null {
  const input = useWorkoutAnalyticsInput()
  return useMemo(() => {
    if (!templateId) return null
    return getWorkoutTemplateAnalytics(input, templateId, period)
  }, [input, templateId, period])
}

export function useTrainingDistribution(period: AnalyticsPeriod): TrainingDistribution {
  const input = useWorkoutAnalyticsInput()
  return useMemo(() => getTrainingDistribution(input, period), [input, period])
}

export function useWorkoutPrAnalytics(period: AnalyticsPeriod): WorkoutPrAnalytics {
  const input = useWorkoutAnalyticsInput()
  return useMemo(() => getWorkoutPrAnalytics(input, period), [input, period])
}

export function useWorkoutCoachingSummary(period: AnalyticsPeriod): WorkoutCoachingSummary {
  const input = useWorkoutAnalyticsInput()
  const distribution = useTrainingDistribution(period)
  return useMemo(
    () => getWorkoutCoachingSummary(input, distribution, period),
    [input, distribution, period],
  )
}

export function useWorkoutAnalyticsChartBundle(
  period: AnalyticsPeriod,
): WorkoutAnalyticsChartBundle {
  const input = useWorkoutAnalyticsInput()
  return useMemo(() => buildWorkoutAnalyticsChartBundle(input, period), [input, period])
}

/** Domain-level model for the shared `AnalyticsDomainPanel` Overview/Insights/Recommendations slots. */
export function useWorkoutAnalyticsDomainModel(period: AnalyticsPeriod): AnalyticsDomainModel {
  const overview = useWorkoutDashboardOverview(period)
  const prAnalytics = useWorkoutPrAnalytics(period)
  const distribution = useTrainingDistribution(period)
  const coachingSummary = useWorkoutCoachingSummary(period)

  return useMemo(
    () => ({
      domainId: 'workout',
      title: 'Workout Analytics',
      periodLabel: ANALYTICS_PERIOD_LABELS[period],
      overview: buildWorkoutDashboardOverviewMetrics(overview),
      insights: buildWorkoutAnalyticsInsights({ prAnalytics, distribution, coachingSummary }),
      recommendations: buildWorkoutAnalyticsRecommendations(coachingSummary),
    }),
    [period, overview, prAnalytics, distribution, coachingSummary],
  )
}

/** Selection + period/search state for the Workout Analytics panel. */
export function useWorkoutAnalyticsState() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')
  const [exerciseQuery, setExerciseQuery] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const exerciseEntries = useExerciseAnalyticsEntries(period, '')
  const filteredExerciseEntries = useExerciseAnalyticsEntries(period, exerciseQuery)
  const templateEntries = useWorkoutTemplateAnalyticsEntries(period)

  const effectiveExerciseId = selectedExerciseId ?? exerciseEntries[0]?.exercise.id ?? null
  const effectiveTemplateId = selectedTemplateId ?? templateEntries[0]?.templateId ?? null

  const selectExercise = useCallback((exerciseId: string) => {
    setSelectedExerciseId(exerciseId)
  }, [])
  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
  }, [])

  return {
    period,
    setPeriod,
    exerciseQuery,
    setExerciseQuery,
    exerciseEntries,
    filteredExerciseEntries,
    templateEntries,
    selectedExerciseId: effectiveExerciseId,
    selectExercise,
    selectedTemplateId: effectiveTemplateId,
    selectTemplate,
  }
}
