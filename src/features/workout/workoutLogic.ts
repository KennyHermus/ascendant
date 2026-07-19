import { DEFAULT_WORKOUT_TEMPLATES } from '@/data/workoutTemplates'
import { computeActivitiesStatistics } from '@/features/workout/workoutStatistics'
import {
  buildInitialCircuitProgress,
} from '@/features/workout/workoutBlockLogic'
import {
  flattenSessionSections,
  sessionLogsFromTemplate,
  syncSessionExercises,
} from '@/features/workout/workoutTemplateLogic'
import { isDurationActivityType } from '@/data/durationActivities'
import type {
  ExerciseSetLog,
  SessionExerciseLog,
  SessionSectionLog,
  WorkoutActivity,
  WorkoutActivityStructure,
  WorkoutSession,
  WorkoutState,
  WorkoutTemplate,
} from '@/types/workout'
import { WORKOUT_SCHEMA_VERSION } from '@/types/workout'
import { computeWallClockElapsedMs, createWallClockTimer, formatWallClockDuration } from '@/lib/workoutWallClock'
import { migrateSessionTiming } from '@/features/workout/workoutTimingLogic'

export const WORKOUT_QUEST_ID = 'workout'

export function createEmptyWorkoutState(): WorkoutState {
  return {
    schemaVersion: WORKOUT_SCHEMA_VERSION,
    templates: DEFAULT_WORKOUT_TEMPLATES.map((template) => ({
      ...template,
      sections: template.sections.map((section) => ({
        ...section,
        exercises: section.exercises.map((exercise) => ({ ...exercise })),
        blocks: section.blocks?.map((block) =>
          block.type === 'circuit'
            ? {
                ...block,
                exercises: block.exercises.map((exercise) => ({ ...exercise })),
              }
            : { ...block },
        ),
      })),
    })),
    sessions: [],
    activities: [],
    activeSessionId: null,
  }
}

function normalizeSet(set: ExerciseSetLog): ExerciseSetLog {
  return {
    ...set,
    completed: set.completed ?? false,
    fields: { ...set.fields },
  }
}

function normalizeExercise(exercise: SessionExerciseLog): SessionExerciseLog {
  return {
    ...exercise,
    sets: exercise.sets.map(normalizeSet),
  }
}

function normalizeSections(sections: SessionSectionLog[]): SessionSectionLog[] {
  return sections.map((section) => ({
    ...section,
    exercises: section.exercises.map(normalizeExercise),
  }))
}

function inferActivityStructure(
  partial: { activityStructure?: WorkoutActivityStructure; activityType?: string; templateId?: string },
): WorkoutActivityStructure {
  if (partial.activityStructure) return partial.activityStructure
  if (partial.activityType && isDurationActivityType(partial.activityType)) return 'duration'
  if (partial.templateId && isDurationActivityType(partial.templateId)) return 'duration'
  return 'exercise'
}

function normalizeSession(session: WorkoutSession): WorkoutSession {
  const migrated = migrateSessionTiming(session)
  const activityStructure = inferActivityStructure(migrated)
  const activityType = migrated.activityType ?? migrated.templateId

  if (activityStructure === 'duration') {
    return {
      ...migrated,
      activityStructure,
      activityType,
      statusBeforeReview: migrated.statusBeforeReview ?? null,
      sections: [],
      exercises: [],
    }
  }

  const sections =
    migrated.sections?.length > 0
      ? normalizeSections(migrated.sections)
      : [
          {
            id: `section-log-legacy-${migrated.id}`,
            sectionId: 'main',
            name: 'Main',
            sortOrder: 0,
            exercises: (migrated.exercises ?? []).map(normalizeExercise),
          },
        ]

  const exercises = syncSessionExercises({ sections, exercises: migrated.exercises })

  return {
    ...migrated,
    activityStructure,
    activityType,
    statusBeforeReview: migrated.statusBeforeReview ?? null,
    resumeTargetStatus: migrated.resumeTargetStatus ?? null,
    circuitProgress: migrated.circuitProgress ?? null,
    sections,
    exercises,
  }
}

function normalizeActivity(activity: WorkoutActivity): WorkoutActivity {
  const activityStructure = inferActivityStructure(activity)
  const activityType = activity.activityType ?? activity.templateId

  if (activityStructure === 'duration') {
    return {
      ...activity,
      activityStructure,
      activityType,
      sections: [],
      exercises: [],
      exerciseCount: 0,
      setCount: 0,
      completedSetCount: 0,
      totalReps: 0,
      totalVolume: 0,
      integration: activity.integration ?? { source: 'manual' },
    }
  }

  const sections =
    activity.sections?.length > 0
      ? normalizeSections(activity.sections)
      : [
          {
            id: `section-log-legacy-${activity.id}`,
            sectionId: 'main',
            name: 'Main',
            sortOrder: 0,
            exercises: (activity.exercises ?? []).map(normalizeExercise),
          },
        ]

  const exercises = syncSessionExercises({ sections, exercises: activity.exercises })
  const stats = computeActivitiesStatistics([
    {
      ...activity,
      sections,
      exercises,
      completedSetCount: activity.completedSetCount ?? 0,
      totalReps: activity.totalReps ?? 0,
      totalVolume: activity.totalVolume ?? 0,
    },
  ])

  return {
    ...activity,
    activityStructure,
    activityType,
    sections,
    exercises,
    completedSetCount:
      activity.completedSetCount ??
      exercises.reduce(
        (sum, ex) => sum + ex.sets.filter((set) => set.completed).length,
        0,
      ),
    totalReps: activity.totalReps ?? stats.totalReps,
    totalVolume: activity.totalVolume ?? stats.totalVolume,
  }
}

export function mergeWorkoutState(partial: Partial<WorkoutState> | undefined): WorkoutState {
  const base = createEmptyWorkoutState()
  if (!partial) return base

  const savedVersion = partial.schemaVersion ?? 0
  const useDefaultTemplates = savedVersion < WORKOUT_SCHEMA_VERSION

  return {
    schemaVersion: WORKOUT_SCHEMA_VERSION,
    templates: useDefaultTemplates
      ? base.templates
      : (partial.templates ?? base.templates).map((template) => ({
          ...template,
          sections: template.sections.map((section) => ({
            ...section,
            exercises: section.exercises.map((exercise) => ({ ...exercise })),
          })),
        })),
    sessions: (partial.sessions ?? []).map(normalizeSession),
    activities: (partial.activities ?? []).map(normalizeActivity),
    activeSessionId: partial.activeSessionId ?? null,
  }
}

export function getTemplateById(
  state: WorkoutState,
  templateId: string,
): WorkoutTemplate | undefined {
  return state.templates.find((t) => t.id === templateId)
}

export function getActiveSession(state: WorkoutState): WorkoutSession | null {
  if (!state.activeSessionId) return null
  const session = state.sessions.find((s) => s.id === state.activeSessionId)
  if (
    !session ||
    session.status === 'completed' ||
    session.status === 'cancelled'
  ) {
    return null
  }
  return session
}

export function getWorkoutActivitiesForDay(
  state: WorkoutState,
  heroDayKey: string,
): WorkoutActivity[] {
  return state.activities
    .filter((activity) => activity.heroDayKey === heroDayKey)
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
    )
}

/** @deprecated Prefer getWorkoutActivitiesForDay — returns first activity on the day. */
export function getTodayWorkoutActivity(
  state: WorkoutState,
  heroDayKey: string,
): WorkoutActivity | undefined {
  return getWorkoutActivitiesForDay(state, heroDayKey)[0]
}

export function getWorkoutActivityById(
  state: WorkoutState,
  activityId: string,
): WorkoutActivity | undefined {
  return state.activities.find((a) => a.id === activityId)
}

export function createSetLog(
  id: string,
  options?: {
    weight?: number
    reps?: number
    rpe?: number
    durationSeconds?: number
    completed?: boolean
    notes?: string
  },
): ExerciseSetLog {
  const fields: ExerciseSetLog['fields'] = {}
  if (options?.weight != null) fields.weight = options.weight
  if (options?.reps != null) fields.reps = options.reps
  if (options?.rpe != null) fields.rpe = options.rpe
  if (options?.durationSeconds != null) fields.durationSeconds = options.durationSeconds
  return {
    id,
    fields,
    completed: options?.completed ?? false,
    notes: options?.notes,
  }
}

/** @deprecated Use sessionLogsFromTemplate — kept for sample data callers */
export function sessionExerciseLogsFromTemplate(template: WorkoutTemplate): SessionExerciseLog[] {
  return flattenSessionSections(sessionLogsFromTemplate(template))
}

export function createSessionFromTemplate(template: WorkoutTemplate): {
  sections: SessionSectionLog[]
  exercises: SessionExerciseLog[]
  circuitProgress: WorkoutSession['circuitProgress']
} {
  const sections = sessionLogsFromTemplate(template)
  const circuitSection = sections.find((section) => section.circuitMeta)
  const circuitProgress = circuitSection
    ? buildInitialCircuitProgress(circuitSection)
    : null

  return {
    sections,
    exercises: flattenSessionSections(sections),
    circuitProgress,
  }
}

export function countSessionSets(exercises: SessionExerciseLog[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
}

export function countCompletedSets(exercises: SessionExerciseLog[]): number {
  return exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((set) => set.completed).length,
    0,
  )
}

export function computeElapsedMs(session: WorkoutSession): number {
  return computeWallClockElapsedMs(session.sessionTimer ?? createWallClockTimer())
}

export function computeDurationMinutes(session: WorkoutSession): number | null {
  const elapsedMs = computeElapsedMs(session)
  if (session.startedAt == null || elapsedMs <= 0) {
    if (session.endedAt && session.sessionTimer?.completedElapsedMs != null) {
      return Math.max(0, Math.round(session.sessionTimer.completedElapsedMs / 60_000))
    }
    return null
  }
  return Math.max(0, Math.round(elapsedMs / 60_000))
}

export function formatElapsedDuration(ms: number): string {
  return formatWallClockDuration(ms)
}

export function buildWorkoutActivityFromSession(
  session: WorkoutSession,
  activityId: string,
  completedAt: string,
  completionGrade: WorkoutActivity['completionGrade'],
  heroDayKey: string,
  resolvedQuestId: string | null,
): WorkoutActivity {
  const durationMs = computeElapsedMs(session)
  const durationMinutes = computeDurationMinutes(session)
  const sections = session.sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, fields: { ...s.fields } })),
    })),
  }))
  const exercises = flattenSessionSections(sections)
  const completedSetCount = countCompletedSets(exercises)
  const stats = computeActivitiesStatistics([
    {
      id: activityId,
      kind: 'workout',
      questId: resolvedQuestId,
      sessionId: session.id,
      templateId: session.templateId,
      templateName: session.templateName,
      activityStructure: 'exercise',
      activityType: session.templateId,
      heroDayKey,
      startedAt: session.startedAt ?? completedAt,
      completedAt,
      completionGrade,
      durationMinutes,
      durationMs,
      exerciseCount: exercises.length,
      setCount: countSessionSets(exercises),
      completedSetCount,
      totalReps: 0,
      totalVolume: 0,
      sections,
      exercises,
      notes: session.notes,
    },
  ])

  return {
    id: activityId,
    kind: 'workout',
    questId: resolvedQuestId,
    sessionId: session.id,
    templateId: session.templateId,
    templateName: session.templateName,
    activityStructure: 'exercise',
    activityType: session.templateId,
    heroDayKey,
    startedAt: session.startedAt ?? completedAt,
    completedAt,
    completionGrade,
    durationMinutes,
    durationMs,
    exerciseCount: exercises.length,
    setCount: countSessionSets(exercises),
    completedSetCount,
    totalReps: stats.totalReps,
    totalVolume: stats.totalVolume,
    sections,
    exercises,
    restPeriods: session.restPeriods ?? [],
    notes: session.notes,
    integration: { source: 'manual' },
    metadata: {
      activityStructure: 'exercise',
      activityType: session.templateId,
      templateId: session.templateId,
      setCount: countSessionSets(exercises),
      completedSetCount,
      totalReps: stats.totalReps,
      totalVolume: stats.totalVolume,
    },
  }
}

export function summarizeWorkoutActivity(activity: WorkoutActivity) {
  return {
    activityId: activity.id,
    templateName: activity.templateName,
    durationMinutes: activity.durationMinutes,
    exerciseCount: activity.exerciseCount,
    setCount: activity.setCount,
    heroDayKey: activity.heroDayKey,
    completedAt: activity.completedAt,
    grade: activity.completionGrade,
  }
}
