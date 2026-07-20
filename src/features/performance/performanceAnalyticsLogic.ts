import { isDateInRange, resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import { getBenchmarkExerciseName } from '@/features/performance/exerciseFamilyLogic'
import type { AnalyticsPeriod, PerformanceAnalytics } from '@/types/analytics'
import type { QuestDefinition } from '@/types/quest'
import type { PerformanceState, PersonalRecordHistoryEntry, PrType } from '@/types/performance'

export interface PerformanceAnalyticsInput {
  performance: PerformanceState
  questDefinitions: QuestDefinition[]
  now: Date
}

function filterHistoryForPeriod(
  history: PersonalRecordHistoryEntry[],
  period: AnalyticsPeriod,
  questDefinitions: QuestDefinition[],
  now: Date,
): PersonalRecordHistoryEntry[] {
  const range = resolvePeriodRange(period, questDefinitions, now)
  if (!range) return history
  return history.filter((entry) => isDateInRange(entry.heroDayKey, range))
}

export function getPerformanceAnalytics(
  input: PerformanceAnalyticsInput,
  period: AnalyticsPeriod = 'lifetime',
): PerformanceAnalytics {
  const { performance } = input
  const periodHistory = filterHistoryForPeriod(
    performance.prHistory,
    period,
    input.questDefinitions,
    input.now,
  )

  const mostImproved = computeMostImproved(periodHistory)

  return {
    totalPrsEarned: periodHistory.length,
    currentOfficialPrs: [...performance.officialRecords].sort((a, b) =>
      a.exerciseId.localeCompare(b.exerciseId),
    ),
    recentPrs: [...periodHistory]
      .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
      .slice(0, 10),
    mostImprovedExercises: mostImproved,
    baselineCompleted: performance.baselineCompletedAt != null,
    assessmentsCompleted: performance.assessments.length,
  }
}

function computeMostImproved(
  history: PersonalRecordHistoryEntry[],
): PerformanceAnalytics['mostImprovedExercises'] {
  const byExercise = new Map<
    string,
    { exerciseId: string; prType: PrType; totalImprovement: number }
  >()

  for (const entry of history) {
    if (entry.oldValue == null) continue
    const improvement = entry.newValue - entry.oldValue
    if (improvement <= 0) continue
    const key = `${entry.exerciseId}:${entry.prType}`
    const current = byExercise.get(key)
    if (!current || improvement > current.totalImprovement) {
      byExercise.set(key, {
        exerciseId: entry.exerciseId,
        prType: entry.prType,
        totalImprovement: improvement,
      })
    }
  }

  return [...byExercise.values()]
    .sort((a, b) => b.totalImprovement - a.totalImprovement)
    .slice(0, 5)
    .map((entry) => ({
      exerciseId: entry.exerciseId,
      exerciseName: getBenchmarkExerciseName(entry.exerciseId),
      prType: entry.prType,
      improvement: entry.totalImprovement,
    }))
}
