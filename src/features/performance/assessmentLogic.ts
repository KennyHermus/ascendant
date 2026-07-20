import {
  BASELINE_ASSESSMENT_DEFINITIONS,
  BASELINE_ASSESSMENT_ID,
  BENCHMARK_ASSESSMENT_BY_ID,
} from '@/data/benchmarkAssessments'
import { EXERCISE_FAMILIES } from '@/data/exerciseFamilies'
import { metricLabel, applyOfficialPrUpdates, buildResultEntryFromSessionEntry } from '@/features/performance/prLogic'
import { recordPersonalRecordAchieved } from '@/features/events/eventLogic'
import type { GameEvent } from '@/types/event'
import type {
  AssessmentSession,
  AssessmentSessionEntry,
  AssessmentSessionStatus,
  PerformanceAssessmentActivity,
  PerformanceState,
} from '@/types/performance'
import { PERFORMANCE_SCHEMA_VERSION } from '@/types/performance'

export function createEmptyPerformanceState(): PerformanceState {
  return {
    schemaVersion: PERFORMANCE_SCHEMA_VERSION,
    exerciseFamilies: EXERCISE_FAMILIES.map((family) => ({
      ...family,
      memberExerciseIds: [...family.memberExerciseIds],
    })),
    officialRecords: [],
    prHistory: [],
    assessments: [],
    sessions: [],
    activeSessionId: null,
    baselineCompletedAt: null,
  }
}

export function mergePerformanceState(
  saved: Partial<PerformanceState> | undefined,
): PerformanceState {
  const defaults = createEmptyPerformanceState()
  if (!saved) return defaults

  return {
    ...defaults,
    ...saved,
    schemaVersion: PERFORMANCE_SCHEMA_VERSION,
    exerciseFamilies:
      saved.exerciseFamilies?.length ? saved.exerciseFamilies : defaults.exerciseFamilies,
    officialRecords: saved.officialRecords ?? [],
    prHistory: saved.prHistory ?? [],
    assessments: saved.assessments ?? [],
    sessions: saved.sessions ?? [],
    activeSessionId: saved.activeSessionId ?? null,
    baselineCompletedAt: saved.baselineCompletedAt ?? null,
  }
}

export function needsBaselineAssessment(state: PerformanceState): boolean {
  return state.baselineCompletedAt == null && state.officialRecords.length === 0
}

export function getActiveAssessmentSession(
  state: PerformanceState,
): AssessmentSession | null {
  if (!state.activeSessionId) return null
  return state.sessions.find((session) => session.id === state.activeSessionId) ?? null
}

function entryFromDefinition(
  definitionId: string,
): AssessmentSessionEntry | null {
  const definition = BENCHMARK_ASSESSMENT_BY_ID.get(definitionId)
  if (!definition) return null

  return {
    definitionId: definition.id,
    benchmarkExerciseId: definition.benchmarkExerciseId,
    exerciseFamilyId: definition.exerciseFamilyId,
    prType: definition.prType,
    metric: definition.metric,
    label: definition.name,
    completed: false,
  }
}

export function createBaselineSession(
  heroDayKey: string,
  sessionId: string = crypto.randomUUID(),
): AssessmentSession {
  return {
    id: sessionId,
    assessmentKind: 'baseline',
    definitionId: BASELINE_ASSESSMENT_ID,
    name: 'Baseline Assessment',
    status: 'draft',
    heroDayKey,
    startedAt: null,
    endedAt: null,
    entries: BASELINE_ASSESSMENT_DEFINITIONS.map((def) => ({
      definitionId: def.id,
      benchmarkExerciseId: def.benchmarkExerciseId,
      exerciseFamilyId: def.exerciseFamilyId,
      prType: def.prType,
      metric: def.metric,
      label: def.name,
      completed: false,
    })),
    activityId: null,
  }
}

export function createPerformanceSession(
  definitionId: string,
  heroDayKey: string,
  sessionId: string = crypto.randomUUID(),
): AssessmentSession | null {
  const definition = BENCHMARK_ASSESSMENT_BY_ID.get(definitionId)
  if (!definition) return null

  const entry = entryFromDefinition(definitionId)
  if (!entry) return null

  return {
    id: sessionId,
    assessmentKind: 'performance',
    definitionId,
    name: definition.name,
    status: 'draft',
    heroDayKey,
    startedAt: null,
    endedAt: null,
    entries: [entry],
    activityId: null,
  }
}

export function startAssessmentSession(session: AssessmentSession): AssessmentSession {
  return {
    ...session,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
  }
}

export function updateAssessmentSessionEntry(
  session: AssessmentSession,
  definitionId: string,
  patch: Partial<
    Pick<
      AssessmentSessionEntry,
      'weight' | 'reps' | 'durationSeconds' | 'distanceMeters' | 'notes' | 'completed'
    >
  >,
): AssessmentSession {
  return {
    ...session,
    entries: session.entries.map((entry) =>
      entry.definitionId === definitionId ? { ...entry, ...patch } : entry,
    ),
  }
}

export function isAssessmentSessionComplete(session: AssessmentSession): boolean {
  return session.entries.every((entry) => entry.completed)
}

export function completeAssessmentSession(
  session: AssessmentSession,
  completedAt: string,
  activityId: string,
): AssessmentSession {
  return {
    ...session,
    status: 'completed',
    endedAt: completedAt,
    activityId,
  }
}

export function cancelAssessmentSession(session: AssessmentSession): AssessmentSession {
  return { ...session, status: 'cancelled' }
}

export function buildPerformanceAssessmentActivity(input: {
  session: AssessmentSession
  activityId: string
  completedAt: string
  heroDayKey: string
  startedAt: string
  results: PerformanceAssessmentActivity['results']
  prUpdateIds: string[]
}): PerformanceAssessmentActivity {
  return {
    id: input.activityId,
    kind: 'performance_assessment',
    heroDayKey: input.heroDayKey,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    completionGrade: 'completed',
    assessmentKind: input.session.assessmentKind,
    assessmentDefinitionId: input.session.definitionId,
    assessmentName: input.session.name,
    results: input.results,
    prUpdateIds: input.prUpdateIds,
  }
}

export function getAssessmentEntryHelp(entry: AssessmentSessionEntry): string {
  return `${metricLabel(entry.metric)} — records ${entry.prType.replace(/_/g, ' ')} official PR`
}

export function canTransitionAssessmentStatus(
  status: AssessmentSessionStatus,
  action: 'start' | 'complete' | 'cancel',
): boolean {
  switch (action) {
    case 'start':
      return status === 'draft'
    case 'complete':
      return status === 'in_progress'
    case 'cancel':
      return status === 'draft' || status === 'in_progress'
  }
}

export function completeAssessmentPipeline(input: {
  session: AssessmentSession
  performance: PerformanceState
  heroDayKey: string
  completedAt: string
  now?: Date
}): { performance: PerformanceState; events: GameEvent[] } {
  const activityId = crypto.randomUUID()
  const startedAt = input.session.startedAt ?? input.completedAt

  const results = input.session.entries
    .map((entry) => buildResultEntryFromSessionEntry(entry))
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)

  const prUpdate = applyOfficialPrUpdates({
    results,
    assessmentId: activityId,
    assessmentKind: input.session.assessmentKind,
    assessmentDefinitionId: input.session.definitionId,
    heroDayKey: input.heroDayKey,
    achievedAt: input.completedAt,
    officialRecords: input.performance.officialRecords,
    prHistory: input.performance.prHistory,
    forceEstablish: input.session.assessmentKind === 'baseline',
  })

  const activity = buildPerformanceAssessmentActivity({
    session: completeAssessmentSession(input.session, input.completedAt, activityId),
    activityId,
    completedAt: input.completedAt,
    heroDayKey: input.heroDayKey,
    startedAt,
    results,
    prUpdateIds: prUpdate.updatedRecordIds,
  })

  const newHistoryEntries = prUpdate.prHistory.slice(input.performance.prHistory.length)
  const events = newHistoryEntries.map((entry) =>
    recordPersonalRecordAchieved({
      heroDayKey: entry.heroDayKey,
      assessmentId: activityId,
      assessmentKind: entry.assessmentKind,
      exerciseId: entry.exerciseId,
      exerciseFamilyId: entry.exerciseFamilyId,
      prType: entry.prType,
      previousDisplayValue: entry.oldDisplayValue,
      newDisplayValue: entry.newDisplayValue,
      previousValue: entry.oldValue,
      newValue: entry.newValue,
      now: input.now,
    }),
  )

  const completedSession = completeAssessmentSession(
    input.session,
    input.completedAt,
    activityId,
  )

  return {
    performance: {
      ...input.performance,
      officialRecords: prUpdate.officialRecords,
      prHistory: prUpdate.prHistory,
      assessments: [...input.performance.assessments, activity],
      sessions: input.performance.sessions.map((session) =>
        session.id === input.session.id ? completedSession : session,
      ),
      activeSessionId: null,
      baselineCompletedAt:
        input.session.assessmentKind === 'baseline'
          ? input.completedAt
          : input.performance.baselineCompletedAt,
    },
    events,
  }
}
