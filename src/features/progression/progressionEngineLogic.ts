import { BENCHMARK_ASSESSMENT_DEFINITIONS } from '@/data/benchmarkAssessments'
import { EXERCISE_BY_ID } from '@/data/exercises'
import { EXERCISE_FAMILIES } from '@/data/exerciseFamilies'
import { getFamilyForExercise } from '@/features/performance/exerciseFamilyLogic'
import {
  evaluateAllAdvancedExercises,
  type AdvancedExerciseReadiness,
} from '@/features/progression/prerequisiteLogic'
import {
  analyzeExerciseTrend,
  countFamilyWorkouts,
  getRecentWorkoutGapDays,
  MIN_WORKOUTS_FOR_TREND,
  type ExerciseTrainingTrend,
} from '@/features/progression/trainingAnalysisLogic'
import { getActiveHeroDayKey } from '@/lib/timeService'
import type { PerformanceState } from '@/types/performance'
import type {
  CoachingRecommendation,
  ProgressionRecommendationKind,
  RecommendationConfidence,
} from '@/types/progression'
import type { WorkoutActivity } from '@/types/workout'

export interface ProgressionEngineInput {
  trainingActivities: WorkoutActivity[]
  performance: PerformanceState
  now: Date
}

const LOAD_EXERCISES = new Set(['bicep-curl', 'hammer-curl', 'side-curl', 'concentration-curl', 'weighted-push-ups'])

function exerciseName(exerciseId: string): string {
  return EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId
}

function makeRecommendation(
  input: ProgressionEngineInput,
  partial: Omit<CoachingRecommendation, 'id' | 'generatedAt' | 'heroDayKey'>,
): CoachingRecommendation {
  return {
    ...partial,
    id: crypto.randomUUID(),
    generatedAt: input.now.toISOString(),
    heroDayKey: getActiveHeroDayKey(input.now),
  }
}

function scoreToConfidence(score: number): RecommendationConfidence {
  if (score >= 8) return 'very_high'
  if (score >= 6) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

function trendConfidence(trend: ExerciseTrainingTrend, base: number): RecommendationConfidence {
  let score = base
  score += Math.min(trend.workoutCount, 4)
  if (trend.consecutiveExceededReps >= 3) score += 2
  if (trend.avgFrequencyDays != null && trend.avgFrequencyDays <= 4) score += 1
  return scoreToConfidence(score)
}

function buildLoadRecommendations(
  input: ProgressionEngineInput,
  trend: ExerciseTrainingTrend,
): CoachingRecommendation[] {
  const results: CoachingRecommendation[] = []
  const { exerciseId } = trend
  const family = getFamilyForExercise(exerciseId)
  const name = exerciseName(exerciseId)
  const latest = trend.snapshots[trend.snapshots.length - 1]
  const usesWeight = LOAD_EXERCISES.has(exerciseId)

  if (trend.workoutCount < MIN_WORKOUTS_FOR_TREND) return results

  if (
    trend.exceededRepsWorkoutCount >= MIN_WORKOUTS_FOR_TREND ||
    trend.consecutiveExceededReps >= MIN_WORKOUTS_FOR_TREND
  ) {
    if (usesWeight && latest?.maxWeight != null && latest.maxWeight > 0) {
      const suggested = Math.ceil((latest.maxWeight + 5) / 5) * 5
      results.push(
        makeRecommendation(input, {
          kind: 'increase_weight',
          exerciseId,
          exerciseFamilyId: family?.id,
          title: `Increase to ${suggested} lb`,
          message: `Consider increasing ${name} to ${suggested} lb on your next session.`,
          reason: `You have exceeded your planned repetitions during the last ${Math.min(trend.workoutCount, trend.consecutiveExceededReps || trend.exceededRepsWorkoutCount)} workouts.`,
          confidence: trendConfidence(trend, 4),
        }),
      )
    } else {
      const currentPlanned = latest?.avgPlannedReps ?? 10
      const suggestedReps = Math.ceil(currentPlanned + 2)
      results.push(
        makeRecommendation(input, {
          kind: 'increase_reps',
          exerciseId,
          exerciseFamilyId: family?.id,
          title: `Increase to ${suggestedReps} reps`,
          message: `Your ${name} training consistently exceeds the planned target.`,
          reason: `You have exceeded your planned repetitions during the last ${Math.min(trend.workoutCount, trend.consecutiveExceededReps || trend.exceededRepsWorkoutCount)} workouts.`,
          confidence: trendConfidence(trend, 4),
        }),
      )
    }
  } else if (
    trend.belowRepsWorkoutCount >= MIN_WORKOUTS_FOR_TREND ||
    trend.consecutiveBelowReps >= MIN_WORKOUTS_FOR_TREND
  ) {
    if (usesWeight && latest?.maxWeight != null && latest.maxWeight > 5) {
      const suggested = Math.max(5, latest.maxWeight - 5)
      results.push(
        makeRecommendation(input, {
          kind: 'reduce_weight',
          exerciseId,
          exerciseFamilyId: family?.id,
          title: `Consider ${suggested} lb`,
          message: `Recent ${name} sessions fell short of planned reps — a lighter load may help quality.`,
          reason: `Actual repetitions were below plan across ${trend.belowRepsWorkoutCount} recent workouts.`,
          confidence: trendConfidence(trend, 3),
        }),
      )
    }
  } else if (trend.workoutCount >= MIN_WORKOUTS_FOR_TREND) {
    results.push(
      makeRecommendation(input, {
        kind: 'maintain_training',
        exerciseId,
        exerciseFamilyId: family?.id,
        title: 'Maintain current training',
        message: `${name} performance is tracking well against your plan.`,
        reason: 'Recent sessions match planned targets — consistency is building strength.',
        confidence: scoreToConfidence(4 + trend.workoutCount),
      }),
    )
  }

  return results
}

function buildAdvancedExerciseRecommendations(
  input: ProgressionEngineInput,
  readinessList: AdvancedExerciseReadiness[],
): CoachingRecommendation[] {
  const practiced = new Set(
    input.trainingActivities.flatMap((a) => a.exercises.map((e) => e.exerciseId)),
  )

  return readinessList
    .filter((entry) => entry.allMet && !practiced.has(entry.definition.exerciseId))
    .map((entry) =>
      makeRecommendation(input, {
        kind: 'introduce_advanced_exercise',
        exerciseFamilyId: entry.definition.exerciseFamilyId,
        targetExerciseId: entry.definition.exerciseId,
        exerciseId: entry.definition.exerciseFamilyId === 'push-up-family' ? 'push-ups' : undefined,
        title: `Ready for ${entry.definition.name}`,
        message: `You appear ready to begin practicing ${entry.definition.name}.`,
        reason: `All prerequisites met: ${entry.prerequisites.map((p) => p.label).join(', ')}.`,
        confidence: scoreToConfidence(6 + entry.prerequisites.length),
      }),
    )
}

function buildAssessmentRecommendations(
  input: ProgressionEngineInput,
): CoachingRecommendation[] {
  if (!input.performance.baselineCompletedAt) return []

  const results: CoachingRecommendation[] = []
  const nowMs = input.now.getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  for (const family of EXERCISE_FAMILIES) {
    if (family.id === 'walking-family') continue

    const familyWorkouts = countFamilyWorkouts(family.memberExerciseIds, input.trainingActivities)
    if (familyWorkouts < 4) continue

    const benchmark = family.benchmarkExerciseId
    const recentAssessment = input.performance.assessments
      .filter((a) =>
        a.results.some((r) => r.benchmarkExerciseId === benchmark),
      )
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]

    const assessmentAgeMs = recentAssessment
      ? nowMs - new Date(recentAssessment.completedAt).getTime()
      : Infinity

    if (assessmentAgeMs < thirtyDaysMs) continue

    const definition = BENCHMARK_ASSESSMENT_DEFINITIONS.find(
      (d) => d.benchmarkExerciseId === benchmark,
    )
    if (!definition) continue

    const benchmarkName = exerciseName(benchmark)
    results.push(
      makeRecommendation(input, {
        kind: 'recommend_assessment',
        exerciseId: benchmark,
        exerciseFamilyId: family.id,
        title: `${definition.name} recommended`,
        message: `Consider performing a ${definition.name} to refresh your official ${benchmarkName} benchmark.`,
        reason: `You have trained the ${family.name} regularly; your last assessment was over 30 days ago or never recorded.`,
        confidence: scoreToConfidence(5 + Math.min(familyWorkouts, 4)),
      }),
    )
  }

  return results
}

function buildConsistencyRecommendations(
  input: ProgressionEngineInput,
): CoachingRecommendation[] {
  const gapDays = getRecentWorkoutGapDays(input.trainingActivities, input.now)
  if (gapDays == null || gapDays < 10) return []

  return [
    makeRecommendation(input, {
      kind: 'improve_consistency',
      title: 'Improve training consistency',
      message: 'It has been a while since your last workout — even a short session keeps momentum.',
      reason: `Last workout was ${gapDays} days ago. Long-term trends need regular training.`,
      confidence: gapDays >= 14 ? 'high' : 'medium',
    }),
  ]
}

function buildRecoveryRecommendations(
  input: ProgressionEngineInput,
): CoachingRecommendation[] {
  const recentWeek = input.trainingActivities.filter((activity) => {
    const ageMs = input.now.getTime() - new Date(activity.completedAt).getTime()
    return ageMs <= 7 * 24 * 60 * 60 * 1000
  })

  if (recentWeek.length < 5) return []

  return [
    makeRecommendation(input, {
      kind: 'add_recovery',
      title: 'Consider additional recovery',
      message: 'You logged many workouts this week — quality recovery supports long-term progress.',
      reason: `${recentWeek.length} workouts completed in the last 7 days.`,
      confidence: recentWeek.length >= 6 ? 'high' : 'medium',
    }),
  ]
}

function buildFamilyConsistencyRecommendations(
  input: ProgressionEngineInput,
): CoachingRecommendation[] {
  const results: CoachingRecommendation[] = []

  for (const family of EXERCISE_FAMILIES) {
    if (family.id === 'walking-family') continue
    const familyWorkouts = countFamilyWorkouts(family.memberExerciseIds, input.trainingActivities)
    if (familyWorkouts < 5) continue

    const memberCounts = family.memberExerciseIds.map((id) => ({
      id,
      count: input.trainingActivities.filter((a) =>
        a.exercises.some((e) => e.exerciseId === id),
      ).length,
    }))
    const practicedMembers = memberCounts.filter((m) => m.count > 0).length
    if (practicedMembers >= family.memberExerciseIds.length - 1) {
      results.push(
        makeRecommendation(input, {
          kind: 'maintain_training',
          exerciseFamilyId: family.id,
          title: `${family.name} breadth`,
          message: `You have consistently completed exercises across the ${family.name}.`,
          reason: `${practicedMembers} of ${family.memberExerciseIds.length} family exercises appear in your training history.`,
          confidence: scoreToConfidence(5 + practicedMembers),
        }),
      )
    }
  }

  return results
}

const TRACKED_LOAD_EXERCISES = [
  'bicep-curl',
  'hammer-curl',
  'push-ups',
  'diamond-push-ups',
  'wide-push-ups',
  'archer-push-ups',
  'weighted-push-ups',
  'clap-push-ups',
]

/** Generates coaching recommendations from multi-workout trends and readiness checks. */
export function generateCoachingRecommendations(
  input: ProgressionEngineInput,
): CoachingRecommendation[] {
  const readiness = evaluateAllAdvancedExercises(
    input.trainingActivities,
    input.performance,
  )

  const loadRecommendations = TRACKED_LOAD_EXERCISES.flatMap((exerciseId) => {
    const trend = analyzeExerciseTrend(exerciseId, input.trainingActivities)
    return buildLoadRecommendations(input, trend)
  })

  const all = [
    ...loadRecommendations,
    ...buildAdvancedExerciseRecommendations(input, readiness),
    ...buildAssessmentRecommendations(input),
    ...buildConsistencyRecommendations(input),
    ...buildRecoveryRecommendations(input),
    ...buildFamilyConsistencyRecommendations(input),
  ]

  return dedupeRecommendations(all)
}

function recommendationKey(rec: CoachingRecommendation): string {
  return `${rec.kind}:${rec.exerciseId ?? ''}:${rec.targetExerciseId ?? ''}:${rec.exerciseFamilyId ?? ''}`
}

function kindPriority(kind: ProgressionRecommendationKind): number {
  switch (kind) {
    case 'introduce_advanced_exercise':
      return 5
    case 'increase_weight':
    case 'increase_reps':
      return 4
    case 'recommend_assessment':
      return 3
    case 'reduce_weight':
      return 3
    case 'improve_consistency':
    case 'add_recovery':
      return 2
    default:
      return 1
  }
}

function dedupeRecommendations(
  recommendations: CoachingRecommendation[],
): CoachingRecommendation[] {
  const byKey = new Map<string, CoachingRecommendation>()
  for (const rec of recommendations) {
    const key = recommendationKey(rec)
    const existing = byKey.get(key)
    if (!existing || kindPriority(rec.kind) > kindPriority(existing.kind)) {
      byKey.set(key, rec)
    }
  }
  return [...byKey.values()].sort(
    (a, b) => kindPriority(b.kind) - kindPriority(a.kind),
  )
}

export function getRecommendationsForExercise(
  recommendations: CoachingRecommendation[],
  exerciseId: string,
): CoachingRecommendation[] {
  const family = getFamilyForExercise(exerciseId)
  return recommendations.filter(
    (rec) =>
      rec.exerciseId === exerciseId ||
      rec.targetExerciseId === exerciseId ||
      (family != null && rec.exerciseFamilyId === family.id && rec.kind !== 'maintain_training'),
  )
}

export function getRecommendationsForFamily(
  recommendations: CoachingRecommendation[],
  exerciseFamilyId: string,
): CoachingRecommendation[] {
  return recommendations.filter((rec) => rec.exerciseFamilyId === exerciseFamilyId)
}
