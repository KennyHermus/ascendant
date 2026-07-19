import {
  findCurrentCircuitExerciseIndex,
  findCurrentExerciseLogId,
} from '@/features/workout/workoutBlockLogic'
import {
  aggregateExerciseStats,
  computeSessionStatistics,
  type WorkoutExerciseStats,
} from '@/features/workout/workoutStatistics'
import {
  getActiveSession,
  getWorkoutActivitiesForDay,
} from '@/features/workout/workoutLogic'
import { isDurationSession } from '@/features/workout/durationActivityLogic'
import type {
  SessionSectionLog,
  WorkoutActivity,
  WorkoutSession,
  WorkoutState,
} from '@/types/workout'

export interface WorkoutSessionProgress extends WorkoutExerciseStats {
  percent: number
  currentExerciseIndex: number
  currentExerciseId: string | null
  circuitCurrentRound: number | null
  circuitTotalRounds: number | null
  circuitExerciseIndex: number | null
  circuitExerciseCount: number | null
}

export interface WorkoutSectionProgress {
  sectionId: string
  name: string
  sortOrder: number
  exerciseCount: number
  completedExerciseCount: number
  remainingExerciseCount: number
  totalSets: number
  completedSets: number
  remainingSets: number
  percent: number
}

export interface WorkoutJourneyProgress {
  label: string
  exercisesCompleted: number
  exercisesTotal: number
  setsCompleted: number
  setsTotal: number
  percent: number
  /** Present when showing a completed activity rather than a live session. */
  activityId?: string
  isComplete?: boolean
}

export function computeSectionProgress(section: SessionSectionLog): WorkoutSectionProgress {
  const stats = aggregateExerciseStats(section.exercises)
  const denominator = Math.max(stats.totalSets, 1)

  return {
    sectionId: section.sectionId,
    name: section.name,
    sortOrder: section.sortOrder,
    exerciseCount: stats.exerciseCount,
    completedExerciseCount: stats.completedExerciseCount,
    remainingExerciseCount: stats.exerciseCount - stats.completedExerciseCount,
    totalSets: stats.totalSets,
    completedSets: stats.completedSets,
    remainingSets: stats.totalSets - stats.completedSets,
    percent: Math.min(100, Math.round((stats.completedSets / denominator) * 100)),
  }
}

export function computeSessionSectionProgress(
  session: WorkoutSession,
): WorkoutSectionProgress[] {
  return [...session.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(computeSectionProgress)
}

export function computeSessionProgress(session: WorkoutSession): WorkoutSessionProgress {
  if (isDurationSession(session)) {
    return {
      exerciseCount: 0,
      completedExerciseCount: 0,
      totalSets: 0,
      completedSets: 0,
      totalReps: 0,
      totalVolume: 0,
      percent:
        session.status === 'review' || session.status === 'ready_for_review' ? 100 : 0,
      currentExerciseIndex: 0,
      currentExerciseId: null,
      circuitCurrentRound: null,
      circuitTotalRounds: null,
      circuitExerciseIndex: null,
      circuitExerciseCount: null,
    }
  }

  const stats = computeSessionStatistics(session)
  const denominator = Math.max(stats.totalSets, 1)
  const percent = Math.min(100, Math.round((stats.completedSets / denominator) * 100))

  const currentExerciseLogId = findCurrentExerciseLogId(session)
  const currentExerciseIndex = currentExerciseLogId
    ? session.exercises.findIndex((entry) => entry.id === currentExerciseLogId)
    : session.exercises.length
  const currentExercise =
    currentExerciseIndex >= 0 && currentExerciseIndex < session.exercises.length
      ? session.exercises[currentExerciseIndex]
      : null

  const circuitProgress = session.circuitProgress

  return {
    ...stats,
    percent,
    currentExerciseIndex:
      currentExerciseIndex >= 0 ? currentExerciseIndex : session.exercises.length,
    currentExerciseId: currentExercise?.exerciseId ?? null,
    circuitCurrentRound: circuitProgress?.currentRound ?? null,
    circuitTotalRounds: circuitProgress?.totalRounds ?? null,
    circuitExerciseIndex: circuitProgress
      ? findCurrentCircuitExerciseIndex(session, circuitProgress)
      : null,
    circuitExerciseCount: circuitProgress?.exerciseLogIds.length ?? null,
  }
}

export function journeyProgressFromSession(
  session: WorkoutSession,
): WorkoutJourneyProgress {
  if (isDurationSession(session)) {
    return {
      label: session.templateName,
      exercisesCompleted: 0,
      exercisesTotal: 0,
      setsCompleted: 0,
      setsTotal: 0,
      percent:
        session.status === 'review' || session.status === 'ready_for_review' ? 100 : 0,
      isComplete: false,
    }
  }

  const progress = computeSessionProgress(session)

  return {
    label: session.templateName,
    exercisesCompleted: progress.completedExerciseCount,
    exercisesTotal: progress.exerciseCount,
    setsCompleted: progress.completedSets,
    setsTotal: progress.totalSets,
    percent: progress.percent,
    isComplete: false,
  }
}

export function journeyProgressFromActivity(
  activity: WorkoutActivity,
): WorkoutJourneyProgress {
  if (activity.activityStructure === 'duration') {
    return {
      label: activity.templateName,
      exercisesCompleted: 0,
      exercisesTotal: 0,
      setsCompleted: 0,
      setsTotal: 0,
      percent: 100,
      activityId: activity.id,
      isComplete: true,
    }
  }

  return {
    label: activity.templateName,
    exercisesCompleted: activity.exerciseCount,
    exercisesTotal: activity.exerciseCount,
    setsCompleted: activity.completedSetCount,
    setsTotal: activity.setCount,
    percent: 100,
    activityId: activity.id,
    isComplete: true,
  }
}

/** Live session progress first, then completed activities for the Hero Day. */
export function getWorkoutJourneyProgressList(
  workout: WorkoutState,
  heroDayKey: string,
): WorkoutJourneyProgress[] {
  const results: WorkoutJourneyProgress[] = []
  const session = getActiveSession(workout)

  if (session && session.heroDayKey === heroDayKey) {
    results.push(journeyProgressFromSession(session))
  }

  for (const activity of getWorkoutActivitiesForDay(workout, heroDayKey)) {
    results.push(journeyProgressFromActivity(activity))
  }

  return results
}

/** @deprecated Prefer getWorkoutJourneyProgressList */
export function getWorkoutJourneyProgress(
  workout: WorkoutState,
  heroDayKey: string,
): WorkoutJourneyProgress | null {
  const list = getWorkoutJourneyProgressList(workout, heroDayKey)
  return list[0] ?? null
}
