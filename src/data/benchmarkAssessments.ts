import type { BenchmarkAssessmentDefinition } from '@/types/performance'

/**
 * Benchmark Performance Assessment definitions.
 * Add new entries here — baseline picks up `includeInBaseline: true` automatically.
 */
export const BENCHMARK_ASSESSMENT_DEFINITIONS: BenchmarkAssessmentDefinition[] = [
  {
    id: 'push-up-test',
    name: 'Push-up Test',
    description: 'Max push-ups in one set.',
    benchmarkExerciseId: 'push-ups',
    exerciseFamilyId: 'push-up-family',
    prType: 'highest_reps',
    metric: 'reps',
    includeInBaseline: true,
    baselineSortOrder: 0,
  },
  {
    id: 'plank-test',
    name: 'Plank Test',
    description: 'Longest plank hold.',
    benchmarkExerciseId: 'plank',
    exerciseFamilyId: 'plank-family',
    prType: 'longest_duration',
    metric: 'duration_seconds',
    includeInBaseline: true,
    baselineSortOrder: 1,
  },
  {
    id: 'bodyweight-squat-test',
    name: 'Bodyweight Squat Test',
    description: 'Max bodyweight squats in one set.',
    benchmarkExerciseId: 'squat',
    exerciseFamilyId: 'squat-family',
    prType: 'highest_reps',
    metric: 'reps',
    includeInBaseline: true,
    baselineSortOrder: 2,
  },
  {
    id: 'bicep-curl-test',
    name: 'Bicep Curl Test',
    description: 'Heaviest weight × reps effort (volume PR).',
    benchmarkExerciseId: 'bicep-curl',
    exerciseFamilyId: 'curl-family',
    prType: 'highest_volume',
    metric: 'weight_and_reps',
    includeInBaseline: true,
    baselineSortOrder: 3,
  },
  {
    id: 'walking-endurance-test',
    name: 'Walking Endurance Test',
    description: 'Longest continuous walk duration.',
    benchmarkExerciseId: 'walking-endurance',
    exerciseFamilyId: 'walking-family',
    prType: 'longest_duration',
    metric: 'duration_seconds',
    includeInBaseline: true,
    baselineSortOrder: 4,
  },
]

export const BENCHMARK_ASSESSMENT_BY_ID = new Map(
  BENCHMARK_ASSESSMENT_DEFINITIONS.map((def) => [def.id, def]),
)

export const BASELINE_ASSESSMENT_DEFINITIONS = [...BENCHMARK_ASSESSMENT_DEFINITIONS]
  .filter((def) => def.includeInBaseline)
  .sort((a, b) => (a.baselineSortOrder ?? 0) - (b.baselineSortOrder ?? 0))

export const BASELINE_ASSESSMENT_ID = 'baseline-assessment'
