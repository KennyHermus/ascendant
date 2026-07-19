import type { ActivityBase } from '@/types/activity'
import type { CompletionGrade } from '@/types/completion'

import type { WallClockTimer } from '@/lib/workoutWallClock'

export const WORKOUT_SCHEMA_VERSION = 9

/** Fallback when a template slot has no explicit set plan. */
export const DEFAULT_SETS_PER_EXERCISE = 2

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'fullBody',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const MOVEMENT_CATEGORIES = [
  'push',
  'pull',
  'squat',
  'hinge',
  'carry',
  'isolation',
  'cardio',
  'stretch',
  'rehab',
] as const

export type MovementCategory = (typeof MOVEMENT_CATEGORIES)[number]

export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'band',
  'other',
] as const

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

export const SET_FIELD_KEYS = [
  'weight',
  'reps',
  'rpe',
  'durationSeconds',
  'distance',
  'tempo',
  'restSeconds',
] as const

export type SetFieldKey = (typeof SET_FIELD_KEYS)[number]

/** Reusable exercise catalog entry (static data). */
export interface ExerciseDefinition {
  id: string
  name: string
  muscleGroup: MuscleGroup
  movementCategory: MovementCategory
  equipment: EquipmentType
  defaultUnits: SetFieldKey[]
  notes?: string
}

/** One planned set in a template — not a logged result. */
export interface PlannedSetTemplate {
  reps?: number
  weight?: number
  durationSeconds?: number
  toFailure?: boolean
  perLeg?: boolean
  perSide?: boolean
  bothArms?: boolean
  /** Display hint e.g. "each leg", "to failure" */
  label?: string
}

/**
 * Flexible exercise target metadata — not every field applies to every exercise.
 * Templates compose `sets`, `setCount`, and labels as needed.
 */
export interface ExercisePrescription {
  /** Human-readable target shown in UI e.g. "10–12 each leg" */
  targetLabel?: string
  setCount?: number
  sets?: PlannedSetTemplate[]
  equipment?: string
  notes?: string
  toFailure?: boolean
  perLeg?: boolean
  perSide?: boolean
  bothArms?: boolean
  /** Target hold/work duration for timed exercises (seconds). */
  durationSeconds?: number
  /** Rest after each set for this exercise (seconds). */
  restAfterSetSeconds?: number
  /** Rest after completing all sets for this exercise (seconds). */
  restAfterExerciseSeconds?: number
}

/** Template exercise slot — references catalog, stores no results. */
export interface WorkoutTemplateExercise {
  exerciseId: string
  sortOrder: number
  prescription?: ExercisePrescription
  notes?: string
}

export const WORKOUT_BLOCK_TYPES = ['exercise', 'circuit', 'rest', 'section'] as const
export type WorkoutBlockType = (typeof WORKOUT_BLOCK_TYPES)[number]

/** Single exercise slot within a program block. */
export interface ExerciseBlockTemplate {
  type: 'exercise'
  id: string
  sortOrder: number
  exerciseId: string
  prescription?: ExercisePrescription
  notes?: string
}

/** Repeat a sequence of exercises with optional rest between rounds. */
export interface CircuitBlockTemplate {
  type: 'circuit'
  id: string
  sortOrder: number
  name?: string
  repeatCount: number
  restAfterCircuitSeconds?: number
  exercises: WorkoutTemplateExercise[]
}

/** Standalone rest interval (future interval/EMOM programs). */
export interface RestBlockTemplate {
  type: 'rest'
  id: string
  sortOrder: number
  durationSeconds: number
  label?: string
}

/** Nested section container for complex programs. */
export interface SectionBlockTemplate {
  type: 'section'
  id: string
  sortOrder: number
  name: string
  blocks: WorkoutBlockTemplate[]
}

export type WorkoutBlockTemplate =
  | ExerciseBlockTemplate
  | CircuitBlockTemplate
  | RestBlockTemplate
  | SectionBlockTemplate

/** Organizes exercises within a workout — grouping only, not a separate activity type. */
export interface WorkoutTemplateSection {
  id: string
  name: string
  sortOrder: number
  /** Section default e.g. "2 sets" applied when slots omit their own plan */
  setCount?: number
  repsLabel?: string
  notes?: string
  /** Rest after completing this section (seconds). */
  restAfterSectionSeconds?: number
  /** Legacy flat exercise list — converted to blocks at session build time when `blocks` is empty. */
  exercises: WorkoutTemplateExercise[]
  /** Structured program blocks (exercise, circuit, rest, section). */
  blocks?: WorkoutBlockTemplate[]
}

/** Reusable workout blueprint. Templates never store session results. */
export interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  estimatedDurationMinutes?: number
  restBetweenSetsSeconds?: number
  restBetweenExercisesSeconds?: number
  /** Full-circuit repeat count (e.g. Core × 2) */
  circuitRounds?: number
  circuitRestSeconds?: number
  sections: WorkoutTemplateSection[]
}

export interface ExerciseTargetTiming {
  plannedDurationSeconds?: number
  plannedReps?: number
  plannedWeight?: number
  plannedRestAfterSetSeconds?: number
  plannedRestAfterExerciseSeconds?: number
}

export interface TimingRecord {
  /** Hero Time ISO when interval started */
  startedAt: string | null
  /** Hero Time ISO when interval ended */
  endedAt: string | null
  /** Wall-clock elapsed ms */
  elapsedMs: number | null
}

export interface SetExecutionTiming extends TimingRecord {
  plannedDurationSeconds?: number
  actualDurationSeconds?: number
}

export interface ExerciseExecutionTiming extends TimingRecord {}

export const REST_PERIOD_KINDS = ['set', 'exercise', 'circuit', 'section'] as const
export type RestPeriodKind = (typeof REST_PERIOD_KINDS)[number]

export interface RestPeriodLog extends TimingRecord {
  id: string
  kind: RestPeriodKind
  plannedSeconds: number
  actualSeconds: number
  exerciseLogId?: string
  setId?: string
  sectionId?: string
}

export interface ExerciseSetLog {
  id: string
  fields: Partial<Record<SetFieldKey, number>>
  completed: boolean
  notes?: string
  /** Circuit round (1-based) when part of a circuit block. */
  circuitRound?: number
  target?: ExerciseTargetTiming
  execution?: SetExecutionTiming
}

export interface SessionExerciseLog {
  id: string
  exerciseId: string
  sectionId: string
  sortOrder: number
  /** Source block id when built from a structured program block. */
  blockId?: string
  blockType?: 'exercise' | 'circuit'
  targetLabel?: string
  sets: ExerciseSetLog[]
  notes?: string
  target?: ExerciseTargetTiming
  execution?: ExerciseExecutionTiming
}

export interface SessionCircuitMeta {
  blockId: string
  repeatCount: number
  restAfterCircuitSeconds?: number
  label?: string
}

export interface CircuitProgress {
  blockId: string
  sectionId: string
  currentRound: number
  totalRounds: number
  restAfterCircuitSeconds?: number
  exerciseLogIds: string[]
}

export interface ActiveExerciseTimer {
  exerciseLogId: string
  setId: string
  plannedDurationSeconds: number
  timer: WallClockTimer
  targetReached: boolean
  startedAt: string
}

export interface ActiveRestTimer {
  id: string
  kind: RestPeriodKind
  plannedSeconds: number
  timer: WallClockTimer
  exerciseLogId?: string
  setId?: string
  sectionId?: string
  startedAt: string
}

export interface SessionSectionLog {
  id: string
  sectionId: string
  name: string
  sortOrder: number
  exercises: SessionExerciseLog[]
  circuitMeta?: SessionCircuitMeta
}

export const WORKOUT_SESSION_STATUSES = [
  'draft',
  'in_progress',
  'paused',
  'ready_for_review',
  'review',
  'completed',
  'cancelled',
] as const

export type WorkoutSessionStatus = (typeof WORKOUT_SESSION_STATUSES)[number]

/** How a workout activity is structured — exercise sessions vs duration-only. */
export const WORKOUT_ACTIVITY_STRUCTURES = ['exercise', 'duration'] as const
export type WorkoutActivityStructure = (typeof WORKOUT_ACTIVITY_STRUCTURES)[number]

/** Optional future health-platform source for synced activities. */
export const ACTIVITY_SOURCES = ['manual', 'apple_health', 'google_fit', 'strava'] as const
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number]

/** Extensible integration metadata — unused for manual entries today. */
export interface WorkoutActivityIntegration {
  source?: ActivitySource
  externalActivityId?: string | null
  lastSyncedAt?: string | null
  syncToken?: string | null
}

export interface WorkoutSession {
  id: string
  templateId: string
  templateName: string
  /** `exercise` for template sessions; `duration` for walk/run/etc. */
  activityStructure: WorkoutActivityStructure
  /** Subtype id — template id for exercise sessions, duration type for duration sessions. */
  activityType: string
  status: WorkoutSessionStatus
  /** Restored when leaving review via Back. */
  statusBeforeReview?: 'in_progress' | 'paused' | 'ready_for_review' | null
  /** When paused after review (or manual pause), status to restore on Resume. */
  resumeTargetStatus?: 'in_progress' | 'ready_for_review' | null
  /** Active circuit traversal state (one circuit block at a time). */
  circuitProgress?: CircuitProgress | null
  heroDayKey: string
  /** Resolved on completion — sessions do not bind to quests at creation. */
  questId: string | null
  startedAt: string | null
  endedAt: string | null
  /** @deprecated Legacy Hero-time pause — migrated into `sessionTimer`. */
  pausedAt?: string | null
  /** @deprecated Legacy pause accumulation — migrated into `sessionTimer`. */
  accumulatedPausedMs?: number
  /** Wall-clock workout session timer (independent of Hero Time). */
  sessionTimer: WallClockTimer
  activeExerciseTimer: ActiveExerciseTimer | null
  activeRestTimer: ActiveRestTimer | null
  restPeriods: RestPeriodLog[]
  sections: SessionSectionLog[]
  /** Flattened exercise list — synced from sections for analytics / legacy reads */
  exercises: SessionExerciseLog[]
  notes?: string
  activityId?: string | null
}

export interface WorkoutActivity extends ActivityBase {
  kind: 'workout'
  questId: string | null
  sessionId: string
  templateId: string
  templateName: string
  activityStructure: WorkoutActivityStructure
  activityType: string
  durationMinutes: number | null
  durationMs: number | null
  exerciseCount: number
  setCount: number
  completedSetCount: number
  totalReps: number
  totalVolume: number
  sections: SessionSectionLog[]
  exercises: SessionExerciseLog[]
  restPeriods?: RestPeriodLog[]
  integration?: WorkoutActivityIntegration
  notes?: string
}

export interface WorkoutState {
  schemaVersion: number
  templates: WorkoutTemplate[]
  sessions: WorkoutSession[]
  activities: WorkoutActivity[]
  activeSessionId: string | null
}

export interface WorkoutActivitySummary {
  activityId: string
  templateName: string
  durationMinutes: number | null
  exerciseCount: number
  setCount: number
  heroDayKey: string
  completedAt: string
  grade: Exclude<CompletionGrade, 'missed'>
}
