import { EXERCISE_BY_ID } from '@/data/exercises'
import type { WorkoutActivity } from '@/types/workout'
import { isDurationActivity } from '@/features/workout/durationActivityLogic'

export function formatWorkoutVolume(volume: number): string {
  if (volume <= 0) return '—'
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k lb`
  return `${Math.round(volume)} lb`
}

export function formatWorkoutGradeLabel(
  grade: WorkoutActivity['completionGrade'],
): string {
  switch (grade) {
    case 'perfect':
      return 'Perfect'
    case 'onTime':
      return 'On Time'
    case 'completed':
      return 'Completed'
  }
}

export function formatWorkoutSummary(activity: WorkoutActivity): string {
  const duration =
    activity.durationMinutes != null ? `${activity.durationMinutes} min` : '—'

  if (isDurationActivity(activity)) {
    return `${activity.templateName} · ${duration}`
  }

  return `${activity.templateName} · ${duration} · ${activity.exerciseCount} exercises · ${activity.completedSetCount} sets`
}

export function getExerciseDisplayName(exerciseId: string): string {
  return EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId
}
