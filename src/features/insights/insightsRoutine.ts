import {
  getQuestAnalytics,
  type AnalyticsInput,
} from '@/features/analytics/analyticsLogic'
import { confidenceFromSampleSize } from '@/features/insights/insightsHelpers'
import { QUEST_CATEGORY_LABELS, SUBCATEGORY_LABELS } from '@/data/questLabels'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { Insight } from '@/types/insights'
import type { NonNegotiableSubcategory } from '@/types/quest'
import { NON_NEGOTIABLE_SUBCATEGORIES } from '@/types/quest'

/**
 * Routine insights — interprets Analytics subcategory / category rates.
 * Does not recompute Analytics; reads `getQuestAnalytics` output.
 */
export function generateRoutineInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const questAnalytics = getQuestAnalytics(input, period)
  const insights: Insight[] = []

  const routines: {
    key: NonNegotiableSubcategory
    label: string
    rate: number | null
    completed: number
    missed: number
  }[] = NON_NEGOTIABLE_SUBCATEGORIES.map((key) => {
    const stats = questAnalytics.bySubcategory[key]
    return {
      key,
      label: SUBCATEGORY_LABELS[key],
      rate: stats.rate,
      completed: stats.completed,
      missed: stats.missed,
    }
  })

  const withData = routines.filter((r) => r.completed + r.missed > 0)

  for (const routine of withData) {
    insights.push({
      id: `routine:completion:${routine.key}`,
      type: 'routineCompletion',
      category: 'routine',
      title: `${routine.label} Completion`,
      explanation: `Your ${routine.label.toLowerCase()} finish rate for this period.`,
      metric: {
        label: 'Completion',
        value: routine.rate !== null ? `${Math.round(routine.rate * 100)}%` : '—',
      },
      subject: routine.label,
      confidence: confidenceFromSampleSize(routine.completed + routine.missed),
      severity:
        routine.rate === null
          ? 'neutral'
          : routine.rate >= 0.8
            ? 'positive'
            : routine.rate < 0.5
              ? 'attention'
              : 'neutral',
    })
  }

  if (withData.length >= 2) {
    const strongest = [...withData].sort(
      (a, b) => (b.rate ?? -1) - (a.rate ?? -1),
    )[0]
    const weakest = [...withData].sort(
      (a, b) => (a.rate ?? 2) - (b.rate ?? 2),
    )[0]

    if (strongest?.rate !== null) {
      insights.push({
        id: `routine:strongest:${strongest.key}`,
        type: 'strongestRoutine',
        category: 'routine',
        title: 'Strongest Routine',
        explanation: `${strongest.label} is your most consistent Non-Negotiable block right now.`,
        metric: {
          label: 'Completion',
          value: `${Math.round(strongest.rate * 100)}%`,
        },
        subject: strongest.label,
        confidence: confidenceFromSampleSize(
          strongest.completed + strongest.missed,
        ),
        severity: 'positive',
      })
    }

    if (
      weakest &&
      weakest.key !== strongest?.key &&
      weakest.rate !== null
    ) {
      insights.push({
        id: `routine:weakest:${weakest.key}`,
        type: 'weakestRoutine',
        category: 'routine',
        title: 'Weakest Routine',
        explanation: `${weakest.label} lags your other Non-Negotiable blocks — a recurring soft spot.`,
        metric: {
          label: 'Completion',
          value: `${Math.round(weakest.rate * 100)}%`,
        },
        subject: weakest.label,
        confidence: confidenceFromSampleSize(weakest.completed + weakest.missed),
        severity: 'attention',
      })
    }
  }

  const weekly = questAnalytics.byCategory.weekly
  const weeklyBonus = questAnalytics.byCategory.weeklyBonus
  const weeklyCompleted = weekly.completed + weeklyBonus.completed
  const weeklyMissed = weekly.missed + weeklyBonus.missed
  const weeklyAttempts = weeklyCompleted + weeklyMissed

  if (weeklyAttempts > 0) {
    const rate = weeklyCompleted / weeklyAttempts
    insights.push({
      id: 'routine:weeklyCategory',
      type: 'weeklyCategoryCompletion',
      category: 'routine',
      title: 'Weekly Category Completion',
      explanation: `Combined ${QUEST_CATEGORY_LABELS.weekly.toLowerCase()} and ${QUEST_CATEGORY_LABELS.weeklyBonus.toLowerCase()} finish rate.`,
      metric: {
        label: 'Completion',
        value: `${Math.round(rate * 100)}%`,
      },
      confidence: confidenceFromSampleSize(weeklyAttempts),
      severity: rate >= 0.7 ? 'positive' : rate < 0.4 ? 'attention' : 'neutral',
    })
  }

  return insights
}
