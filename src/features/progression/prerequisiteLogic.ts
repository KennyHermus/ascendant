import { ADVANCED_EXERCISE_DEFINITIONS } from '@/data/exercisePrerequisites'
import { EXERCISE_FAMILIES } from '@/data/exerciseFamilies'
import {
  countExerciseWorkouts,
  countFamilyWorkouts,
  getMaxRepsFromTraining,
} from '@/features/progression/trainingAnalysisLogic'
import { getFamilyForExercise } from '@/features/performance/exerciseFamilyLogic'
import type { OfficialPersonalRecord, PerformanceState } from '@/types/performance'
import type {
  AdvancedExerciseDefinition,
  ExercisePrerequisiteDefinition,
  PrerequisiteKind,
} from '@/types/progression'
import type { WorkoutActivity } from '@/types/workout'

export interface PrerequisiteEvaluation {
  kind: PrerequisiteKind
  label: string
  met: boolean
  detail?: string
}

export interface AdvancedExerciseReadiness {
  definition: AdvancedExerciseDefinition
  prerequisites: PrerequisiteEvaluation[]
  allMet: boolean
  metCount: number
}

const SHOULDER_EXERCISES = new Set([
  'w-raise',
  'dumbbell-overhead-press',
  'superman-raises',
  'overhead-stick-swings',
])

const TRICEPS_EXERCISES = new Set(['diamond-push-ups', 'tricep-extension', 'archer-push-ups'])

const CORE_EXERCISES = new Set([
  'plank',
  'high-plank',
  'push-up-plank',
  'oblique-plank',
  'six-inches-hold',
  'reverse-crunch',
  'knee-to-elbow-crunch',
])

const BALANCE_EXERCISES = new Set(['single-leg-stand', 'bulgarian-split-squat'])

const PSEUDO_PLANCHE_EXERCISES = new Set(['push-up-plank', 'high-plank'])

const CURL_FAMILY = EXERCISE_FAMILIES.find((f) => f.id === 'curl-family')
const PUSH_UP_FAMILY = EXERCISE_FAMILIES.find((f) => f.id === 'push-up-family')

function getPushUpOfficialReps(records: OfficialPersonalRecord[]): number | null {
  const record = records.find(
    (r) => r.exerciseId === 'push-ups' && r.prType === 'highest_reps',
  )
  return record?.currentValue ?? null
}

function countExercisesInSet(exerciseIds: Set<string>, activities: WorkoutActivity[]): number {
  return activities.filter((activity) =>
    activity.exercises.some((e) => exerciseIds.has(e.exerciseId)),
  ).length
}

function evaluatePrerequisite(
  prereq: ExercisePrerequisiteDefinition,
  activities: WorkoutActivity[],
  performance: PerformanceState,
): PrerequisiteEvaluation {
  const minWorkouts = prereq.minWorkouts ?? 3
  const minPushUpReps = prereq.minPushUpReps ?? 25

  switch (prereq.kind) {
    case 'push_up_benchmark': {
      const hasPr = performance.officialRecords.some(
        (r) => r.exerciseId === 'push-ups' && r.prType === 'highest_reps',
      )
      const workouts = countExerciseWorkouts('push-ups', activities)
      const met = hasPr || workouts >= minWorkouts
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: hasPr
          ? 'Official push-up benchmark established'
          : `${workouts} push-up training sessions logged`,
      }
    }
    case 'shoulder_strength': {
      const count = countExercisesInSet(SHOULDER_EXERCISES, activities)
      const familyCount = PUSH_UP_FAMILY
        ? countFamilyWorkouts(PUSH_UP_FAMILY.memberExerciseIds, activities)
        : 0
      const met = count >= minWorkouts || familyCount >= 8
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: met
          ? 'Shoulder work or push-up family volume supports readiness'
          : 'Continue shoulder and push-up family training',
      }
    }
    case 'triceps_strength': {
      const count = countExercisesInSet(TRICEPS_EXERCISES, activities)
      const met = count >= minWorkouts
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: `${count} sessions with triceps-focused work`,
      }
    }
    case 'arm_strength': {
      const curlWorkouts = CURL_FAMILY
        ? countFamilyWorkouts(CURL_FAMILY.memberExerciseIds, activities)
        : 0
      const met = curlWorkouts >= (prereq.minWorkouts ?? 4)
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: `${curlWorkouts} curl family sessions logged`,
      }
    }
    case 'core_stability': {
      const count = countExercisesInSet(CORE_EXERCISES, activities)
      const met = count >= minWorkouts
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: `${count} core stability sessions logged`,
      }
    }
    case 'balance': {
      const count = countExercisesInSet(BALANCE_EXERCISES, activities)
      const met = count >= minWorkouts
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: `${count} balance-focused sessions logged`,
      }
    }
    case 'pseudo_planche_practice': {
      const count = countExercisesInSet(PSEUDO_PLANCHE_EXERCISES, activities)
      const met = count >= minWorkouts
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: `${count} planche lean / plank practice sessions`,
      }
    }
    case 'wrist_strength': {
      const familyCount = PUSH_UP_FAMILY
        ? countFamilyWorkouts(PUSH_UP_FAMILY.memberExerciseIds, activities)
        : 0
      const met = familyCount >= (prereq.minWorkouts ?? 6)
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: `${familyCount} push-up family sessions build wrist resilience`,
      }
    }
    case 'recommended_push_up_pr': {
      const official = getPushUpOfficialReps(performance.officialRecords)
      const trainingMax = getMaxRepsFromTraining('push-ups', activities)
      const best = Math.max(official ?? 0, trainingMax)
      const met = best >= minPushUpReps
      return {
        kind: prereq.kind,
        label: prereq.label,
        met,
        detail: met
          ? `Push-up capacity at ${best} reps`
          : `Build toward ${minPushUpReps} reps (current best ${best})`,
      }
    }
    default:
      return { kind: prereq.kind, label: prereq.label, met: false }
  }
}

export function evaluateAdvancedExerciseReadiness(
  definition: AdvancedExerciseDefinition,
  activities: WorkoutActivity[],
  performance: PerformanceState,
): AdvancedExerciseReadiness {
  const prerequisites = definition.prerequisites.map((prereq) =>
    evaluatePrerequisite(prereq, activities, performance),
  )
  const metCount = prerequisites.filter((p) => p.met).length
  return {
    definition,
    prerequisites,
    allMet: metCount === prerequisites.length,
    metCount,
  }
}

export function evaluateAllAdvancedExercises(
  activities: WorkoutActivity[],
  performance: PerformanceState,
): AdvancedExerciseReadiness[] {
  return ADVANCED_EXERCISE_DEFINITIONS.map((def) =>
    evaluateAdvancedExerciseReadiness(def, activities, performance),
  )
}

export function getFamilyForAdvancedExercise(
  exerciseId: string,
): ReturnType<typeof getFamilyForExercise> {
  return getFamilyForExercise(exerciseId)
}
