import { flattenSessionSections } from '@/features/workout/workoutTemplateLogic'
import {
  maybeAutoEnterReview,
  maybeRevertReadyForReview,
} from '@/features/workout/workoutTimingLogic'
import { isExerciseComplete } from '@/features/workout/workoutStatistics'
import type {
  ExerciseSetLog,
  SessionExerciseLog,
  WorkoutSession,
  WorkoutState,
} from '@/types/workout'

export function updateSessionInState(
  state: WorkoutState,
  sessionId: string,
  updater: (session: WorkoutSession) => WorkoutSession,
): WorkoutState {
  return {
    ...state,
    sessions: state.sessions.map((session) =>
      session.id === sessionId ? updater(session) : session,
    ),
  }
}

function isSessionEditable(session: WorkoutSession): boolean {
  return (
    session.status === 'draft' ||
    session.status === 'in_progress' ||
    session.status === 'paused' ||
    session.status === 'ready_for_review'
  )
}

function mapExerciseInSession(
  session: WorkoutSession,
  exerciseLogId: string,
  mapper: (exercise: SessionExerciseLog) => SessionExerciseLog,
): WorkoutSession {
  const sections = session.sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((entry) =>
      entry.id === exerciseLogId ? mapper(entry) : entry,
    ),
  }))

  return {
    ...session,
    sections,
    exercises: flattenSessionSections(sections),
  }
}

export function addSetToExercise(
  session: WorkoutSession,
  exerciseLogId: string,
  set: ExerciseSetLog,
): WorkoutSession {
  if (!isSessionEditable(session)) return session

  return mapExerciseInSession(session, exerciseLogId, (entry) => ({
    ...entry,
    sets: [...entry.sets, set],
  }))
}

export function updateSetOnExercise(
  session: WorkoutSession,
  exerciseLogId: string,
  setId: string,
  patch: {
    fields?: Partial<ExerciseSetLog['fields']>
    completed?: boolean
    notes?: string
  },
): WorkoutSession {
  if (!isSessionEditable(session)) return session

  return mapExerciseInSession(session, exerciseLogId, (entry) => ({
    ...entry,
    sets: entry.sets.map((set) =>
      set.id === setId
        ? {
            ...set,
            fields: patch.fields ? { ...set.fields, ...patch.fields } : set.fields,
            completed: patch.completed ?? set.completed,
            notes: patch.notes ?? set.notes,
          }
        : set,
    ),
  }))
}

export function toggleSetComplete(
  session: WorkoutSession,
  exerciseLogId: string,
  setId: string,
): WorkoutSession {
  const exercise = session.exercises.find((entry) => entry.id === exerciseLogId)
  const set = exercise?.sets.find((entry) => entry.id === setId)
  if (!set || !isSessionEditable(session)) return session

  let updated = updateSetOnExercise(session, exerciseLogId, setId, {
    completed: !set.completed,
  })
  updated = maybeRevertReadyForReview(updated)
  if (
    updated.status === 'in_progress' &&
    updated.exercises.every(isExerciseComplete)
  ) {
    updated = maybeAutoEnterReview(updated)
  }
  return updated
}

export function removeSetFromExercise(
  session: WorkoutSession,
  exerciseLogId: string,
  setId: string,
): WorkoutSession {
  if (!isSessionEditable(session)) return session

  return mapExerciseInSession(session, exerciseLogId, (entry) => ({
    ...entry,
    sets: entry.sets.filter((set) => set.id !== setId),
  }))
}

/** Cancel editable sessions from prior Hero Days when the day rolls over. */
export function cancelStaleSessions(
  state: WorkoutState,
  currentHeroDayKey: string,
): WorkoutState {
  let activeSessionId = state.activeSessionId

  const sessions = state.sessions.map((session) => {
    if (
      (session.status === 'in_progress' ||
        session.status === 'paused' ||
        session.status === 'ready_for_review' ||
        session.status === 'review' ||
        session.status === 'draft') &&
      session.heroDayKey !== currentHeroDayKey
    ) {
      if (activeSessionId === session.id) activeSessionId = null
      return { ...session, status: 'cancelled' as const }
    }
    return session
  })

  if (sessions === state.sessions && activeSessionId === state.activeSessionId) {
    return state
  }

  return { ...state, sessions, activeSessionId }
}

export function cloneExerciseLogs(
  exercises: SessionExerciseLog[],
): SessionExerciseLog[] {
  return exercises.map((entry) => ({
    ...entry,
    sets: entry.sets.map((set) => ({
      ...set,
      completed: set.completed ?? false,
      fields: { ...set.fields },
    })),
  }))
}
