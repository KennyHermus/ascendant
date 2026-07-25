import { EXERCISE_BY_ID } from '@/data/exercises'
import { getExerciseRoles } from '@/data/exerciseRoles'
import { getFamilyForExercise } from '@/features/performance/exerciseFamilyLogic'
import { filterActivitiesForPeriod, type WorkoutAnalyticsInput } from '@/features/workoutAnalytics/workoutAnalyticsInput'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { ExerciseRole } from '@/types/progression'
import type { MovementCategory, MuscleGroup } from '@/types/workout'

export interface DistributionBucket {
  id: string
  label: string
  count: number
  /** 0–100, relative to the total within this dimension. */
  percent: number
}

export const MUSCLE_REGIONS = ['upper', 'lower', 'core', 'fullBody'] as const
export type MuscleRegion = (typeof MUSCLE_REGIONS)[number]

export const TRAINING_TYPES = ['strength', 'cardio', 'mobility'] as const
export type TrainingType = (typeof TRAINING_TYPES)[number]

const MUSCLE_REGION_LABELS: Record<MuscleRegion, string> = {
  upper: 'Upper Body',
  lower: 'Lower Body',
  core: 'Core',
  fullBody: 'Full Body',
}

const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  mobility: 'Mobility',
}

const ROLE_LABELS: Record<ExerciseRole, string> = {
  foundation: 'Foundation',
  variation: 'Variation',
  strength: 'Strength',
  power: 'Power',
  skill: 'Skill',
  accessory: 'Accessory',
}

const MUSCLE_REGION_BY_GROUP: Record<MuscleGroup, MuscleRegion> = {
  chest: 'upper',
  back: 'upper',
  shoulders: 'upper',
  arms: 'upper',
  legs: 'lower',
  core: 'core',
  fullBody: 'fullBody',
}

const TRAINING_TYPE_BY_MOVEMENT: Record<MovementCategory, TrainingType> = {
  push: 'strength',
  pull: 'strength',
  squat: 'strength',
  hinge: 'strength',
  carry: 'strength',
  isolation: 'strength',
  cardio: 'cardio',
  stretch: 'mobility',
  rehab: 'mobility',
}

export interface TrainingDistribution {
  byFamily: DistributionBucket[]
  byRole: DistributionBucket[]
  byMuscleRegion: DistributionBucket[]
  byTrainingType: DistributionBucket[]
  byWorkoutCategory: DistributionBucket[]
  totalCompletedSets: number
}

class CountAccumulator {
  private readonly labels = new Map<string, string>()
  private readonly counts = new Map<string, number>()

  add(id: string, label: string, amount: number): void {
    if (amount <= 0) return
    this.labels.set(id, label)
    this.counts.set(id, (this.counts.get(id) ?? 0) + amount)
  }

  toBuckets(): DistributionBucket[] {
    const total = [...this.counts.values()].reduce((sum, v) => sum + v, 0)
    return [...this.counts.entries()]
      .map(([id, count]) => ({
        id,
        label: this.labels.get(id) ?? id,
        count,
        percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }
}

/**
 * Training balance across exercise families, roles, muscle regions, and
 * training type — weighted by completed sets. Workout category weighted by
 * workout count. Purpose: surface imbalance, not just raw activity counts.
 */
export function getTrainingDistribution(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): TrainingDistribution {
  const activities = filterActivitiesForPeriod(input, period)

  const familyAcc = new CountAccumulator()
  const roleAcc = new CountAccumulator()
  const muscleRegionAcc = new CountAccumulator()
  const trainingTypeAcc = new CountAccumulator()
  const categoryAcc = new CountAccumulator()
  let totalCompletedSets = 0

  for (const activity of activities) {
    categoryAcc.add(activity.templateId, activity.templateName, 1)

    for (const exercise of activity.exercises) {
      const completedSets = exercise.sets.filter((s) => s.completed).length
      if (completedSets === 0) continue
      totalCompletedSets += completedSets

      const family = getFamilyForExercise(exercise.exerciseId)
      familyAcc.add(family?.id ?? 'unassigned', family?.name ?? 'Unassigned', completedSets)

      const roles = getExerciseRoles(exercise.exerciseId)
      if (roles.length === 0) {
        roleAcc.add('unassigned', 'Unassigned', completedSets)
      } else {
        for (const role of roles) {
          roleAcc.add(role, ROLE_LABELS[role], completedSets)
        }
      }

      const definition = EXERCISE_BY_ID.get(exercise.exerciseId)
      if (definition) {
        const region = MUSCLE_REGION_BY_GROUP[definition.muscleGroup]
        muscleRegionAcc.add(region, MUSCLE_REGION_LABELS[region], completedSets)

        const trainingType = TRAINING_TYPE_BY_MOVEMENT[definition.movementCategory]
        trainingTypeAcc.add(trainingType, TRAINING_TYPE_LABELS[trainingType], completedSets)
      }
    }
  }

  return {
    byFamily: familyAcc.toBuckets(),
    byRole: roleAcc.toBuckets(),
    byMuscleRegion: muscleRegionAcc.toBuckets(),
    byTrainingType: trainingTypeAcc.toBuckets(),
    byWorkoutCategory: categoryAcc.toBuckets(),
    totalCompletedSets,
  }
}
