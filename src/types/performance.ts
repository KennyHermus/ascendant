/**
 * Performance & Personal Record system (v0.0.4).
 *
 * Hierarchy:
 *   Hero Assessment → Fitness Assessment → Performance / Baseline Assessment
 *
 * Training (WorkoutActivity) records execution data only.
 * Official PRs update exclusively from completed Performance Assessments.
 */

export const PERFORMANCE_SCHEMA_VERSION = 1

/** Future assessment domains — only `fitness` is implemented. */
export const HERO_ASSESSMENT_DOMAINS = [
  'fitness',
  'nutrition',
  'learning',
  'financial',
  'wellness',
] as const

export type HeroAssessmentDomain = (typeof HERO_ASSESSMENT_DOMAINS)[number]

export const FITNESS_ASSESSMENT_KINDS = ['baseline', 'performance'] as const

export type FitnessAssessmentKind = (typeof FITNESS_ASSESSMENT_KINDS)[number]

export const PR_TYPES = [
  'highest_weight',
  'highest_reps',
  'longest_duration',
  'longest_distance',
  'highest_volume',
] as const

export type PrType = (typeof PR_TYPES)[number]

/** How a benchmark assessment captures input. */
export const BENCHMARK_METRICS = [
  'reps',
  'duration_seconds',
  'distance_meters',
  'weight_and_reps',
] as const

export type BenchmarkMetric = (typeof BENCHMARK_METRICS)[number]

export interface ExerciseFamily {
  id: string
  name: string
  /** Stable exercise id — official PR anchor for the family. */
  benchmarkExerciseId: string
  memberExerciseIds: string[]
}

/** Static definition for a benchmark test (data-driven). */
export interface BenchmarkAssessmentDefinition {
  id: string
  name: string
  description?: string
  benchmarkExerciseId: string
  exerciseFamilyId: string
  prType: PrType
  metric: BenchmarkMetric
  includeInBaseline: boolean
  /** Display order within baseline flow. */
  baselineSortOrder?: number
}

export interface AssessmentResultEntry {
  benchmarkExerciseId: string
  exerciseFamilyId: string
  prType: PrType
  /** Canonical numeric value used for PR comparison. */
  value: number
  displayValue: string
  weight?: number
  reps?: number
  durationSeconds?: number
  distanceMeters?: number
  volume?: number
  notes?: string
}

export interface OfficialPersonalRecord {
  id: string
  exerciseId: string
  exerciseFamilyId: string
  prType: PrType
  currentValue: number
  previousValue: number | null
  displayValue: string
  achievedAt: string
  heroDayKey: string
  assessmentId: string
  assessmentKind: FitnessAssessmentKind
}

export interface PersonalRecordHistoryEntry {
  id: string
  exerciseId: string
  exerciseFamilyId: string
  prType: PrType
  oldValue: number | null
  newValue: number
  oldDisplayValue: string | null
  newDisplayValue: string
  achievedAt: string
  heroDayKey: string
  assessmentId: string
  assessmentKind: FitnessAssessmentKind
  assessmentDefinitionId: string
}

export const ASSESSMENT_SESSION_STATUSES = [
  'draft',
  'in_progress',
  'review',
  'completed',
  'cancelled',
] as const

export type AssessmentSessionStatus = (typeof ASSESSMENT_SESSION_STATUSES)[number]

export interface AssessmentSessionEntry {
  definitionId: string
  benchmarkExerciseId: string
  exerciseFamilyId: string
  prType: PrType
  metric: BenchmarkMetric
  label: string
  completed: boolean
  weight?: number
  reps?: number
  durationSeconds?: number
  distanceMeters?: number
  notes?: string
}

export interface AssessmentSession {
  id: string
  assessmentKind: FitnessAssessmentKind
  /** Primary definition id — `baseline` for multi-exercise baseline. */
  definitionId: string
  name: string
  status: AssessmentSessionStatus
  heroDayKey: string
  startedAt: string | null
  endedAt: string | null
  entries: AssessmentSessionEntry[]
  activityId?: string | null
}

/** Completed assessment activity — distinct from WorkoutActivity. */
export interface PerformanceAssessmentActivity {
  id: string
  kind: 'performance_assessment'
  heroDayKey: string
  startedAt: string
  completedAt: string
  completionGrade: 'completed'
  assessmentKind: FitnessAssessmentKind
  assessmentDefinitionId: string
  assessmentName: string
  results: AssessmentResultEntry[]
  prUpdateIds: string[]
  metadata?: Record<string, string | number | boolean | null>
}

export interface PerformanceState {
  schemaVersion: number
  exerciseFamilies: ExerciseFamily[]
  officialRecords: OfficialPersonalRecord[]
  prHistory: PersonalRecordHistoryEntry[]
  assessments: PerformanceAssessmentActivity[]
  sessions: AssessmentSession[]
  activeSessionId: string | null
  /** Set when baseline assessment completes — initial benchmarks established. */
  baselineCompletedAt: string | null
}

export interface PrUpdateResult {
  officialRecords: OfficialPersonalRecord[]
  prHistory: PersonalRecordHistoryEntry[]
  updatedRecordIds: string[]
  historyEntryIds: string[]
}
