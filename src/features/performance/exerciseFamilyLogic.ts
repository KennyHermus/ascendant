import { EXERCISE_FAMILIES, EXERCISE_FAMILY_BY_BENCHMARK, EXERCISE_FAMILY_BY_ID } from '@/data/exerciseFamilies'
import { EXERCISE_BY_ID } from '@/data/exercises'
import type { ExerciseFamily } from '@/types/performance'

export function getExerciseFamily(familyId: string): ExerciseFamily | undefined {
  return EXERCISE_FAMILY_BY_ID.get(familyId)
}

export function getFamilyForBenchmarkExercise(
  benchmarkExerciseId: string,
): ExerciseFamily | undefined {
  return EXERCISE_FAMILY_BY_BENCHMARK.get(benchmarkExerciseId)
}

export function getBenchmarkExerciseName(exerciseId: string): string {
  if (exerciseId === 'walking-endurance') return 'Walking'
  return EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId
}

export function isMemberOfFamily(exerciseId: string, family: ExerciseFamily): boolean {
  return family.memberExerciseIds.includes(exerciseId)
}

export function getFamilyForExercise(exerciseId: string): ExerciseFamily | undefined {
  return EXERCISE_FAMILIES.find((family) => family.memberExerciseIds.includes(exerciseId))
}
