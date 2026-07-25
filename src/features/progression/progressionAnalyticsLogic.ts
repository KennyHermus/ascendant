import { resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { EXERCISE_FAMILIES } from '@/data/exerciseFamilies'
import type { AnalyticsPeriod } from '@/types/analytics'
import type {
  CoachingRecommendationHistoryEntry,
  ProgressionRecommendationKind,
  RecommendationConfidence,
} from '@/types/progression'
import type { CoachingState } from '@/types/progression'

export interface ProgressionAnalytics {
  totalRecommendations: number
  recentRecommendations: CoachingRecommendationHistoryEntry[]
  mostFrequentKinds: { kind: ProgressionRecommendationKind; count: number }[]
  mostActiveFamilies: { exerciseFamilyId: string; familyName: string; count: number }[]
  confidenceDistribution: Record<RecommendationConfidence, number>
  activeRecommendationCount: number
}

export function getProgressionAnalytics(input: {
  coaching: CoachingState
  period: AnalyticsPeriod
  now: Date
}): ProgressionAnalytics {
  const range = resolvePeriodRange(input.period, QUEST_DEFINITIONS, input.now)
  const history = input.coaching.recommendationHistory.filter((entry) => {
    if (range == null) return true
    const day = entry.heroDayKey
    return day >= range.start && day <= range.end
  })

  const kindCounts = new Map<ProgressionRecommendationKind, number>()
  const familyCounts = new Map<string, number>()
  const confidenceDistribution: Record<RecommendationConfidence, number> = {
    low: 0,
    medium: 0,
    high: 0,
    very_high: 0,
  }

  for (const entry of history) {
    kindCounts.set(entry.kind, (kindCounts.get(entry.kind) ?? 0) + 1)
    confidenceDistribution[entry.confidence] += 1
    if (entry.exerciseFamilyId) {
      familyCounts.set(
        entry.exerciseFamilyId,
        (familyCounts.get(entry.exerciseFamilyId) ?? 0) + 1,
      )
    }
  }

  const mostFrequentKinds = [...kindCounts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const mostActiveFamilies = [...familyCounts.entries()]
    .map(([exerciseFamilyId, count]) => ({
      exerciseFamilyId,
      familyName:
        EXERCISE_FAMILIES.find((f) => f.id === exerciseFamilyId)?.name ?? exerciseFamilyId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalRecommendations: history.length,
    recentRecommendations: [...history]
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .slice(0, 10),
    mostFrequentKinds,
    mostActiveFamilies,
    confidenceDistribution,
    activeRecommendationCount: input.coaching.activeRecommendations.length,
  }
}
