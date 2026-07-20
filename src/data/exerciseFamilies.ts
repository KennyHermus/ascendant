import type { ExerciseFamily } from '@/types/performance'

/**
 * Exercise families group related catalog exercises.
 * Official PRs anchor to `benchmarkExerciseId` within each family.
 *
 * Member ids must match `src/data/exercises.ts` — stable exercise ids, not display names.
 */
export const EXERCISE_FAMILIES: ExerciseFamily[] = [
  {
    id: 'push-up-family',
    name: 'Push-up Family',
    benchmarkExerciseId: 'push-ups',
    memberExerciseIds: [
      'push-ups',
      'diamond-push-ups',
      'wide-push-ups',
      'archer-push-ups',
      'weighted-push-ups',
      'clap-push-ups',
    ],
  },
  {
    id: 'plank-family',
    name: 'Plank Family',
    benchmarkExerciseId: 'plank',
    memberExerciseIds: ['plank', 'high-plank', 'push-up-plank', 'oblique-plank'],
  },
  {
    id: 'squat-family',
    name: 'Bodyweight Squat Family',
    benchmarkExerciseId: 'squat',
    memberExerciseIds: ['squat', 'chair-squats', 'bulgarian-split-squat', 'goblet-adductor-squat'],
  },
  {
    id: 'curl-family',
    name: 'Curl Family',
    benchmarkExerciseId: 'bicep-curl',
    memberExerciseIds: ['bicep-curl', 'hammer-curl', 'side-curl'],
  },
  {
    id: 'walking-family',
    name: 'Walking Endurance',
    benchmarkExerciseId: 'walking-endurance',
    memberExerciseIds: ['walking-endurance'],
  },
]

export const EXERCISE_FAMILY_BY_ID = new Map(
  EXERCISE_FAMILIES.map((family) => [family.id, family]),
)

export const EXERCISE_FAMILY_BY_BENCHMARK = new Map(
  EXERCISE_FAMILIES.map((family) => [family.benchmarkExerciseId, family]),
)
