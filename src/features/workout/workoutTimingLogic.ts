import { getCurrentGameTime } from '@/lib/gameTime'
import {
  completeWallClockTimer,
  computeWallClockElapsedMs,
  createWallClockTimer,
  pauseWallClockTimer,
  resumeWallClockTimer,
  startWallClockTimer,
} from '@/lib/workoutWallClock'
import { flattenSessionSections } from '@/features/workout/workoutTemplateLogic'
import {
  advanceCircuitRound,
  isCircuitRoundComplete,
  isLastExerciseInCircuitRound,
} from '@/features/workout/workoutBlockLogic'
import { isExerciseComplete } from '@/features/workout/workoutStatistics'
import type {
  ActiveExerciseTimer,
  ActiveRestTimer,
  ExerciseSetLog,
  RestPeriodKind,
  RestPeriodLog,
  SessionExerciseLog,
  WorkoutSession,
  WorkoutTemplate,
} from '@/types/workout'

export function createDefaultSessionTiming(): Pick<
  WorkoutSession,
  'sessionTimer' | 'activeExerciseTimer' | 'activeRestTimer' | 'restPeriods'
> {
  return {
    sessionTimer: createWallClockTimer(),
    activeExerciseTimer: null,
    activeRestTimer: null,
    restPeriods: [],
  }
}

export function computeSessionElapsedMs(session: WorkoutSession): number {
  return computeWallClockElapsedMs(session.sessionTimer ?? createWallClockTimer())
}

export function computeExerciseTimerElapsedMs(timer: ActiveExerciseTimer): number {
  return computeWallClockElapsedMs(timer.timer)
}

export function computeRestTimerElapsedMs(timer: ActiveRestTimer): number {
  return computeWallClockElapsedMs(timer.timer)
}

export function isTimedSet(set: ExerciseSetLog, exercise: SessionExerciseLog): boolean {
  const planned =
    set.target?.plannedDurationSeconds ??
    exercise.target?.plannedDurationSeconds ??
    set.fields.durationSeconds
  return planned != null && planned > 0
}

export function getSetPlannedDurationSeconds(
  set: ExerciseSetLog,
  exercise: SessionExerciseLog,
): number | null {
  const value =
    set.target?.plannedDurationSeconds ??
    exercise.target?.plannedDurationSeconds ??
    set.fields.durationSeconds
  return value != null && value > 0 ? value : null
}

export function resolveRestAfterSetSeconds(
  set: ExerciseSetLog,
  exercise: SessionExerciseLog,
  template: WorkoutTemplate,
): number | null {
  const value =
    set.target?.plannedRestAfterSetSeconds ??
    exercise.target?.plannedRestAfterExerciseSeconds ??
    template.restBetweenSetsSeconds
  return value != null && value > 0 ? value : null
}

export function resolveRestAfterExerciseSeconds(
  exercise: SessionExerciseLog,
  template: WorkoutTemplate,
): number | null {
  const value =
    exercise.target?.plannedRestAfterExerciseSeconds ??
    template.restBetweenExercisesSeconds
  return value != null && value > 0 ? value : null
}

export function isWorkoutSessionActive(session: WorkoutSession): boolean {
  return (
    session.status === 'draft' ||
    session.status === 'in_progress' ||
    session.status === 'paused' ||
    session.status === 'ready_for_review' ||
    session.status === 'review'
  )
}

export function isSessionTimerRunning(session: WorkoutSession): boolean {
  return session.status === 'in_progress' || session.status === 'ready_for_review'
}

export function startSessionTimer(
  session: WorkoutSession,
  heroStartedAt: string,
  atMs: number = Date.now(),
): WorkoutSession {
  return {
    ...session,
    status: 'in_progress',
    startedAt: heroStartedAt,
    sessionTimer: startWallClockTimer(session.sessionTimer ?? createWallClockTimer(), atMs),
  }
}

export function pauseSessionTimer(
  session: WorkoutSession,
  atMs: number = Date.now(),
): WorkoutSession {
  const resumeTargetStatus: WorkoutSession['resumeTargetStatus'] =
    session.status === 'ready_for_review'
      ? 'ready_for_review'
      : session.status === 'in_progress'
        ? 'in_progress'
        : session.resumeTargetStatus ?? null

  return {
    ...session,
    status: 'paused',
    resumeTargetStatus,
    sessionTimer: pauseWallClockTimer(session.sessionTimer ?? createWallClockTimer(), atMs),
  }
}

export function resumeSessionTimer(
  session: WorkoutSession,
  atMs: number = Date.now(),
): WorkoutSession {
  const allComplete =
    session.activityStructure !== 'duration' &&
    session.exercises.every(isExerciseComplete)
  const nextStatus =
    session.resumeTargetStatus ??
    (allComplete ? 'ready_for_review' : 'in_progress')

  return {
    ...session,
    status: nextStatus,
    resumeTargetStatus: null,
    sessionTimer: resumeWallClockTimer(session.sessionTimer ?? createWallClockTimer(), atMs),
  }
}

export function enterSessionReview(
  session: WorkoutSession,
  atMs: number = Date.now(),
): WorkoutSession {
  const logicalStatus =
    session.status === 'paused' && session.resumeTargetStatus
      ? session.resumeTargetStatus
      : session.status

  const statusBeforeReview: NonNullable<WorkoutSession['statusBeforeReview']> =
    logicalStatus === 'paused'
      ? 'paused'
      : logicalStatus === 'ready_for_review'
        ? 'ready_for_review'
        : 'in_progress'

  return {
    ...session,
    status: 'review',
    statusBeforeReview,
    resumeTargetStatus: null,
    sessionTimer: pauseWallClockTimer(session.sessionTimer ?? createWallClockTimer(), atMs),
    activeExerciseTimer: session.activeExerciseTimer
      ? session.activeExerciseTimer.timer.pausedAtWallMs == null
        ? {
            ...session.activeExerciseTimer,
            timer: pauseWallClockTimer(session.activeExerciseTimer.timer, atMs),
          }
        : session.activeExerciseTimer
      : null,
    activeRestTimer: session.activeRestTimer
      ? session.activeRestTimer.timer.pausedAtWallMs == null
        ? {
            ...session.activeRestTimer,
            timer: pauseWallClockTimer(session.activeRestTimer.timer, atMs),
          }
        : session.activeRestTimer
      : null,
  }
}

export function resumeSessionFromReview(
  session: WorkoutSession,
): WorkoutSession {
  const restoreStatus = session.statusBeforeReview ?? 'in_progress'
  const needsExplicitResume =
    restoreStatus === 'in_progress' || restoreStatus === 'ready_for_review'

  return {
    ...session,
    status: needsExplicitResume ? 'paused' : restoreStatus,
    resumeTargetStatus: needsExplicitResume ? restoreStatus : null,
    statusBeforeReview: null,
    sessionTimer: session.sessionTimer ?? createWallClockTimer(),
  }
}

export function cancelSessionState(
  session: WorkoutSession,
  atMs: number = Date.now(),
): WorkoutSession {
  const timer = session.sessionTimer ?? createWallClockTimer()
  const stoppedTimer =
    timer.wallStartedAtMs != null ? completeWallClockTimer(timer, atMs) : timer

  return {
    ...session,
    status: 'cancelled',
    statusBeforeReview: null,
    activeExerciseTimer: null,
    activeRestTimer: null,
    sessionTimer: stoppedTimer,
  }
}

export function finalizeSessionTimer(
  session: WorkoutSession,
  atMs: number = Date.now(),
): WorkoutSession {
  return {
    ...session,
    sessionTimer: completeWallClockTimer(session.sessionTimer ?? createWallClockTimer(), atMs),
  }
}

export function markSessionReadyForReview(session: WorkoutSession): WorkoutSession {
  if (session.activityStructure === 'duration') return session
  if (session.status !== 'in_progress' && session.status !== 'paused') return session
  const allComplete = session.exercises.every(isExerciseComplete)
  if (!allComplete) return session
  return { ...session, status: 'ready_for_review' }
}

/** If a set is uncompleted while ready for review, return to active logging. */
export function maybeRevertReadyForReview(session: WorkoutSession): WorkoutSession {
  if (session.status !== 'ready_for_review') return session
  if (session.exercises.every(isExerciseComplete)) return session
  return { ...session, status: 'in_progress' }
}

/** After final exercise: ReadyForReview, then auto-open review (View 2). */
export function maybeAutoEnterReview(session: WorkoutSession): WorkoutSession {
  if (session.status !== 'in_progress') return session
  if (session.activityStructure === 'duration') return session
  const allComplete = session.exercises.every(isExerciseComplete)
  if (!allComplete) return session
  return enterSessionReview(markSessionReadyForReview(session))
}

export function startExerciseTimerState(
  session: WorkoutSession,
  exerciseLogId: string,
  setId: string,
  plannedDurationSeconds: number,
): WorkoutSession {
  const now = getCurrentGameTime()
  return {
    ...session,
    activeExerciseTimer: {
      exerciseLogId,
      setId,
      plannedDurationSeconds,
      targetReached: false,
      startedAt: now.toISOString(),
      timer: startWallClockTimer(createWallClockTimer()),
    },
  }
}

export function pauseExerciseTimerState(session: WorkoutSession): WorkoutSession {
  if (!session.activeExerciseTimer) return session
  return {
    ...session,
    activeExerciseTimer: {
      ...session.activeExerciseTimer,
      timer: pauseWallClockTimer(session.activeExerciseTimer.timer),
    },
  }
}

export function resumeExerciseTimerState(session: WorkoutSession): WorkoutSession {
  if (!session.activeExerciseTimer) return session
  return {
    ...session,
    activeExerciseTimer: {
      ...session.activeExerciseTimer,
      timer: resumeWallClockTimer(session.activeExerciseTimer.timer),
    },
  }
}

export function stopExerciseTimerState(
  session: WorkoutSession,
  template: WorkoutTemplate,
  actualDurationSeconds: number,
): WorkoutSession {
  if (!session.activeExerciseTimer) return session
  const { exerciseLogId, setId, plannedDurationSeconds, timer, startedAt } =
    session.activeExerciseTimer
  const endedAt = getCurrentGameTime().toISOString()
  const elapsedMs = computeWallClockElapsedMs(completeWallClockTimer(timer))

  const updated = mapSetInSession(session, exerciseLogId, setId, (set) => ({
    ...set,
    completed: true,
    fields: {
      ...set.fields,
      durationSeconds: actualDurationSeconds,
    },
    execution: {
      startedAt,
      endedAt,
      elapsedMs,
      plannedDurationSeconds,
      actualDurationSeconds,
    },
  }))

  const withExerciseEnd = mapExerciseInSession(updated, exerciseLogId, (exercise) => ({
    ...exercise,
    execution: exercise.execution ?? {
      startedAt,
      endedAt,
      elapsedMs,
    },
  }))

  const withRest = applyRestAfterCompletedSet(
    { ...withExerciseEnd, activeExerciseTimer: null },
    template,
    exerciseLogId,
    setId,
  )

  const reviewed = maybeAutoEnterReview(withRest)

  return reviewed
}

export function markExerciseTimerTargetReached(session: WorkoutSession): WorkoutSession {
  if (!session.activeExerciseTimer) return session
  return {
    ...session,
    activeExerciseTimer: {
      ...session.activeExerciseTimer,
      targetReached: true,
    },
  }
}

export function startRestTimerState(
  session: WorkoutSession,
  input: {
    kind: RestPeriodKind
    plannedSeconds: number
    exerciseLogId?: string
    setId?: string
    sectionId?: string
  },
): WorkoutSession {
  return {
    ...session,
    activeRestTimer: {
      id: crypto.randomUUID(),
      kind: input.kind,
      plannedSeconds: input.plannedSeconds,
      exerciseLogId: input.exerciseLogId,
      setId: input.setId,
      sectionId: input.sectionId,
      startedAt: getCurrentGameTime().toISOString(),
      timer: startWallClockTimer(createWallClockTimer()),
    },
  }
}

export function pauseRestTimerState(session: WorkoutSession): WorkoutSession {
  if (!session.activeRestTimer) return session
  return {
    ...session,
    activeRestTimer: {
      ...session.activeRestTimer,
      timer: pauseWallClockTimer(session.activeRestTimer.timer),
    },
  }
}

export function resumeRestTimerState(session: WorkoutSession): WorkoutSession {
  if (!session.activeRestTimer) return session
  return {
    ...session,
    activeRestTimer: {
      ...session.activeRestTimer,
      timer: resumeWallClockTimer(session.activeRestTimer.timer),
    },
  }
}

function finalizeRestTimer(
  session: WorkoutSession,
  atMs: number = Date.now(),
): { session: WorkoutSession; log: RestPeriodLog | null } {
  if (!session.activeRestTimer) return { session, log: null }
  const timer = completeWallClockTimer(session.activeRestTimer.timer, atMs)
  const elapsedMs = timer.completedElapsedMs ?? 0
  const actualSeconds = Math.max(0, Math.round(elapsedMs / 1000))
  const log: RestPeriodLog = {
    id: session.activeRestTimer.id,
    kind: session.activeRestTimer.kind,
    plannedSeconds: session.activeRestTimer.plannedSeconds,
    actualSeconds,
    exerciseLogId: session.activeRestTimer.exerciseLogId,
    setId: session.activeRestTimer.setId,
    sectionId: session.activeRestTimer.sectionId,
    startedAt: session.activeRestTimer.startedAt,
    endedAt: getCurrentGameTime().toISOString(),
    elapsedMs,
  }

  let nextSession: WorkoutSession = {
    ...session,
    activeRestTimer: null,
    restPeriods: [...(session.restPeriods ?? []), log],
  }

  if (log.kind === 'circuit') {
    nextSession = advanceCircuitRound(nextSession)
  }

  return { session: nextSession, log }
}

export function stopRestTimerState(session: WorkoutSession): WorkoutSession {
  return finalizeRestTimer(session).session
}

export function skipRestTimerState(session: WorkoutSession): WorkoutSession {
  return finalizeRestTimer(session).session
}

function mapExerciseInSession(
  session: WorkoutSession,
  exerciseLogId: string,
  mapper: (exercise: SessionExerciseLog) => SessionExerciseLog,
): WorkoutSession {
  const sections = session.sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((exercise) =>
      exercise.id === exerciseLogId ? mapper(exercise) : exercise,
    ),
  }))
  return {
    ...session,
    sections,
    exercises: flattenSessionSections(sections),
  }
}

function mapSetInSession(
  session: WorkoutSession,
  exerciseLogId: string,
  setId: string,
  mapper: (set: ExerciseSetLog, exercise: SessionExerciseLog) => ExerciseSetLog,
): WorkoutSession {
  return mapExerciseInSession(session, exerciseLogId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => (set.id === setId ? mapper(set, exercise) : set)),
  }))
}

export function applyRestAfterCompletedSet(
  session: WorkoutSession,
  template: WorkoutTemplate,
  exerciseLogId: string,
  setId: string,
): WorkoutSession {
  if (session.status !== 'in_progress') return session

  const exercise = session.exercises.find((entry) => entry.id === exerciseLogId)
  const set = exercise?.sets.find((entry) => entry.id === setId)
  if (!exercise || !set) return session

  const progress = session.circuitProgress
  if (
    progress &&
    isLastExerciseInCircuitRound(progress, exerciseLogId) &&
    isCircuitRoundComplete(session, progress)
  ) {
    const { currentRound, totalRounds, restAfterCircuitSeconds, sectionId } = progress
    if (currentRound < totalRounds && restAfterCircuitSeconds != null && restAfterCircuitSeconds > 0) {
      return startRestTimerState(session, {
        kind: 'circuit',
        plannedSeconds: restAfterCircuitSeconds,
        sectionId,
      })
    }
    return session
  }

  if (progress && exercise.blockId === progress.blockId) {
    return session
  }

  const restSeconds = resolveRestAfterSetSeconds(set, exercise, template)
  if (restSeconds != null) {
    return startRestTimerState(session, {
      kind: 'set',
      plannedSeconds: restSeconds,
      exerciseLogId,
      setId,
    })
  }

  const exerciseRest = resolveRestAfterExerciseSeconds(exercise, template)
  const allSetsDone = exercise.sets.every((entry) => entry.completed)
  if (allSetsDone && exerciseRest != null) {
    return startRestTimerState(session, {
      kind: 'exercise',
      plannedSeconds: exerciseRest,
      exerciseLogId,
      sectionId: exercise.sectionId,
    })
  }

  return session
}

export function finalizeUntimedSetLog(
  session: WorkoutSession,
  template: WorkoutTemplate,
  exerciseLogId: string,
  setId: string,
  fields: { weight?: number; reps?: number },
): WorkoutSession {
  const now = getCurrentGameTime().toISOString()
  let updated = mapSetInSession(session, exerciseLogId, setId, (set) => ({
    ...set,
    completed: true,
    fields: {
      ...set.fields,
      ...(fields.weight != null ? { weight: fields.weight } : {}),
      ...(fields.reps != null ? { reps: fields.reps } : {}),
    },
    execution: {
      startedAt: now,
      endedAt: now,
      elapsedMs: 0,
    },
  }))

  updated = applyRestAfterCompletedSet(updated, template, exerciseLogId, setId)
  updated = maybeAutoEnterReview(updated)
  return updated
}

export function migrateSessionTiming(session: WorkoutSession): WorkoutSession {
  const sessionTimer =
    session.sessionTimer ??
    createWallClockTimer()

  if (
    session.sessionTimer == null &&
    session.startedAt &&
    (session.accumulatedPausedMs != null || session.pausedAt != null)
  ) {
    // Legacy saves without wall timer — best-effort anchor from Hero timestamps.
    const startMs = new Date(session.startedAt).getTime()
    if (!Number.isNaN(startMs)) {
      sessionTimer.wallStartedAtMs = startMs
      sessionTimer.accumulatedPausedMs = session.accumulatedPausedMs ?? 0
      if (session.status === 'paused' && session.pausedAt) {
        sessionTimer.pausedAtWallMs = new Date(session.pausedAt).getTime()
      }
    }
  }

  return {
    ...session,
    sessionTimer,
    activeExerciseTimer: session.activeExerciseTimer ?? null,
    activeRestTimer: session.activeRestTimer ?? null,
    restPeriods: session.restPeriods ?? [],
  }
}
