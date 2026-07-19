import {
  DURATION_ACTIVITY_DEFINITIONS,
  type DurationActivityType,
} from '@/data/durationActivities'
import { createDefaultSessionTiming } from '@/features/workout/workoutTimingLogic'
import {
  computeDurationMinutes,
  computeElapsedMs,
} from '@/features/workout/workoutLogic'
import type { WorkoutActivity, WorkoutSession } from '@/types/workout'
import type { CompletionGrade } from '@/types/completion'

export function isDurationSession(session: WorkoutSession): boolean {
  return session.activityStructure === 'duration'
}

export function isDurationActivity(activity: WorkoutActivity): boolean {
  return activity.activityStructure === 'duration'
}

export function createDurationSession(
  activityType: DurationActivityType,
  heroDayKey: string,
  sessionId: string = crypto.randomUUID(),
): WorkoutSession {
  const definition = DURATION_ACTIVITY_DEFINITIONS[activityType]

  return {
    id: sessionId,
    templateId: activityType,
    templateName: definition.name,
    activityStructure: 'duration',
    activityType,
    status: 'draft',
    heroDayKey,
    questId: null,
    startedAt: null,
    endedAt: null,
    ...createDefaultSessionTiming(),
    sections: [],
    exercises: [],
    activityId: null,
  }
}

export function buildDurationWorkoutActivityFromSession(
  session: WorkoutSession,
  activityId: string,
  completedAt: string,
  completionGrade: Exclude<CompletionGrade, 'missed'>,
  heroDayKey: string,
  resolvedQuestId: string | null,
): WorkoutActivity {
  const durationMs = computeElapsedMs(session)
  const durationMinutes = computeDurationMinutes(session)

  return {
    id: activityId,
    kind: 'workout',
    questId: resolvedQuestId,
    sessionId: session.id,
    templateId: session.activityType,
    templateName: session.templateName,
    activityStructure: 'duration',
    activityType: session.activityType,
    heroDayKey,
    startedAt: session.startedAt ?? completedAt,
    completedAt,
    completionGrade,
    durationMinutes,
    durationMs,
    exerciseCount: 0,
    setCount: 0,
    completedSetCount: 0,
    totalReps: 0,
    totalVolume: 0,
    sections: [],
    exercises: [],
    restPeriods: session.restPeriods ?? [],
    integration: { source: 'manual' },
    notes: session.notes,
    metadata: {
      activityStructure: 'duration',
      activityType: session.activityType,
      durationMs,
    },
  }
}

export function finishLabelForSession(session: WorkoutSession): string {
  if (isDurationSession(session)) {
    return `Finish ${session.templateName}`
  }
  return 'Finish Workout'
}
