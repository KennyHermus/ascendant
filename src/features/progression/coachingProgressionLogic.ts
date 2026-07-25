import { recordCoachingRecommendation } from '@/features/events/eventLogic'
import { generateCoachingRecommendations } from '@/features/progression/progressionEngineLogic'
import type { GameEvent } from '@/types/event'
import type { PerformanceState } from '@/types/performance'
import type {
  CoachingRecommendation,
  CoachingRecommendationHistoryEntry,
  CoachingState,
} from '@/types/progression'
import { PROGRESSION_SCHEMA_VERSION } from '@/types/progression'
import type { WorkoutActivity } from '@/types/workout'

export function createEmptyCoachingState(): CoachingState {
  return {
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    activeRecommendations: [],
    recommendationHistory: [],
    lastGeneratedAt: null,
  }
}

export function mergeCoachingState(saved: Partial<CoachingState> | undefined): CoachingState {
  const defaults = createEmptyCoachingState()
  if (!saved) return defaults
  return {
    ...defaults,
    ...saved,
    schemaVersion: PROGRESSION_SCHEMA_VERSION,
    activeRecommendations: saved.activeRecommendations ?? [],
    recommendationHistory: saved.recommendationHistory ?? [],
    lastGeneratedAt: saved.lastGeneratedAt ?? null,
  }
}

function recommendationSignature(rec: Pick<CoachingRecommendation, 'kind' | 'exerciseId' | 'targetExerciseId' | 'title'>): string {
  return `${rec.kind}:${rec.exerciseId ?? ''}:${rec.targetExerciseId ?? ''}:${rec.title}`
}

function isDuplicateInHistory(
  rec: CoachingRecommendation,
  history: CoachingRecommendationHistoryEntry[],
  heroDayKey: string,
): boolean {
  const sig = recommendationSignature(rec)
  return history.some(
    (entry) =>
      entry.heroDayKey === heroDayKey && recommendationSignature(entry) === sig,
  )
}

const TIMELINE_CONFIDENCE: Set<CoachingRecommendation['confidence']> = new Set([
  'high',
  'very_high',
])

const TIMELINE_KINDS: Set<CoachingRecommendation['kind']> = new Set([
  'introduce_advanced_exercise',
  'increase_weight',
  'increase_reps',
  'recommend_assessment',
  'improve_consistency',
])

function shouldEmitTimelineEvent(rec: CoachingRecommendation): boolean {
  return TIMELINE_CONFIDENCE.has(rec.confidence) && TIMELINE_KINDS.has(rec.kind)
}

function isRecentDuplicate(
  rec: CoachingRecommendation,
  history: CoachingRecommendationHistoryEntry[],
  withinDays = 7,
): boolean {
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000
  return history.some(
    (entry) =>
      entry.kind === rec.kind &&
      entry.exerciseId === rec.exerciseId &&
      entry.targetExerciseId === rec.targetExerciseId &&
      entry.exerciseFamilyId === rec.exerciseFamilyId &&
      new Date(entry.recordedAt).getTime() >= cutoff,
  )
}

export function runCoachingPipeline(input: {
  coaching: CoachingState
  performance: PerformanceState
  trainingActivities: WorkoutActivity[]
  now: Date
}): { coaching: CoachingState; events: GameEvent[] } {
  const recommendations = generateCoachingRecommendations({
    trainingActivities: input.trainingActivities,
    performance: input.performance,
    now: input.now,
  })

  const recordedAt = input.now.toISOString()
  const newHistoryEntries: CoachingRecommendationHistoryEntry[] = []
  const events: GameEvent[] = []

  for (const rec of recommendations) {
    if (isDuplicateInHistory(rec, input.coaching.recommendationHistory, rec.heroDayKey)) {
      continue
    }
    newHistoryEntries.push({ ...rec, recordedAt })

    if (
      shouldEmitTimelineEvent(rec) &&
      !isRecentDuplicate(rec, input.coaching.recommendationHistory)
    ) {
      events.push(recordCoachingRecommendation(rec, input.now))
    }
  }

  return {
    coaching: {
      ...input.coaching,
      activeRecommendations: recommendations,
      recommendationHistory: [...input.coaching.recommendationHistory, ...newHistoryEntries],
      lastGeneratedAt: recordedAt,
    },
    events,
  }
}
