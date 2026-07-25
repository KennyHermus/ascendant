import type { ExerciseRole } from '@/types/progression'

/**
 * Exercise roles describe WHY an exercise exists in training.
 * Multiple roles are supported per exercise.
 */
export const EXERCISE_ROLES_BY_ID: Record<string, ExerciseRole[]> = {
  'push-ups': ['foundation'],
  'diamond-push-ups': ['variation'],
  'wide-push-ups': ['variation'],
  'archer-push-ups': ['variation'],
  'weighted-push-ups': ['strength'],
  'clap-push-ups': ['power'],
  'tiger-bend-push-ups': ['skill'],
  'one-arm-push-ups': ['skill'],
  'planche-push-ups': ['skill'],
  'bicep-curl': ['foundation'],
  'hammer-curl': ['variation'],
  'side-curl': ['variation'],
  'concentration-curl': ['accessory'],
  plank: ['foundation'],
  'high-plank': ['variation'],
  'push-up-plank': ['variation'],
  squat: ['foundation'],
  'chair-squats': ['variation'],
  'bulgarian-split-squat': ['strength'],
  'goblet-adductor-squat': ['variation'],
}

export function getExerciseRoles(exerciseId: string): ExerciseRole[] {
  return EXERCISE_ROLES_BY_ID[exerciseId] ?? []
}
