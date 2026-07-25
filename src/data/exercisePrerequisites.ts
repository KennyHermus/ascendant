import type { AdvancedExerciseDefinition } from '@/types/progression'

/**
 * Advanced exercises define prerequisites instead of linear progression paths.
 * Meeting prerequisites means the hero is ready to begin practicing — not that
 * foundational exercises are replaced.
 */
export const ADVANCED_EXERCISE_DEFINITIONS: AdvancedExerciseDefinition[] = [
  {
    exerciseId: 'tiger-bend-push-ups',
    name: 'Tiger Bend Push-ups',
    exerciseFamilyId: 'push-up-family',
    roles: ['skill'],
    prerequisites: [
      { kind: 'push_up_benchmark', label: 'Push-up benchmark established', minWorkouts: 5 },
      { kind: 'shoulder_strength', label: 'Shoulder strength', minWorkouts: 3 },
      { kind: 'triceps_strength', label: 'Triceps strength', minWorkouts: 3 },
      { kind: 'recommended_push_up_pr', label: 'Recommended Push-up PR', minPushUpReps: 25 },
    ],
  },
  {
    exerciseId: 'one-arm-push-ups',
    name: 'One-arm Push-ups',
    exerciseFamilyId: 'push-up-family',
    roles: ['skill'],
    prerequisites: [
      { kind: 'push_up_benchmark', label: 'Push-up benchmark established', minWorkouts: 5 },
      { kind: 'arm_strength', label: 'Arm strength', minWorkouts: 4 },
      { kind: 'core_stability', label: 'Core stability', minWorkouts: 4 },
      { kind: 'balance', label: 'Balance', minWorkouts: 3 },
      { kind: 'recommended_push_up_pr', label: 'Recommended Push-up PR', minPushUpReps: 30 },
    ],
  },
  {
    exerciseId: 'planche-push-ups',
    name: 'Planche Push-ups',
    exerciseFamilyId: 'push-up-family',
    roles: ['skill'],
    prerequisites: [
      { kind: 'pseudo_planche_practice', label: 'Pseudo planche practice', minWorkouts: 3 },
      { kind: 'core_stability', label: 'Core strength', minWorkouts: 4 },
      { kind: 'shoulder_strength', label: 'Shoulder strength', minWorkouts: 4 },
      { kind: 'wrist_strength', label: 'Wrist strength', minWorkouts: 6 },
      { kind: 'recommended_push_up_pr', label: 'Recommended Push-up PR', minPushUpReps: 35 },
    ],
  },
]

export const ADVANCED_EXERCISE_BY_ID = new Map(
  ADVANCED_EXERCISE_DEFINITIONS.map((def) => [def.exerciseId, def]),
)
