import type {
  AssessmentResultEntry,
  AssessmentSessionEntry,
  BenchmarkMetric,
  FitnessAssessmentKind,
  OfficialPersonalRecord,
  PersonalRecordHistoryEntry,
  PrType,
  PrUpdateResult,
} from '@/types/performance'

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins <= 0) return `${secs}s`
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function formatPrValue(prType: PrType, value: number): string {
  switch (prType) {
    case 'highest_weight':
      return `${value} lb`
    case 'highest_reps':
      return `${value} reps`
    case 'longest_duration':
      return formatDuration(value)
    case 'longest_distance':
      return `${(value / 1000).toFixed(2)} km`
    case 'highest_volume':
      return `${Math.round(value)} lb·reps`
  }
}

export function canonicalValueFromEntry(
  entry: Pick<
    AssessmentResultEntry,
    'prType' | 'value' | 'weight' | 'reps' | 'durationSeconds' | 'distanceMeters' | 'volume'
  >,
): number {
  if (entry.value != null && entry.value > 0) return entry.value
  switch (entry.prType) {
    case 'highest_weight':
      return entry.weight ?? 0
    case 'highest_reps':
      return entry.reps ?? 0
    case 'longest_duration':
      return entry.durationSeconds ?? 0
    case 'longest_distance':
      return entry.distanceMeters ?? 0
    case 'highest_volume':
      return entry.volume ?? (entry.weight ?? 0) * (entry.reps ?? 0)
  }
}

export function buildResultEntryFromSessionEntry(
  entry: AssessmentSessionEntry,
): AssessmentResultEntry | null {
  const value = canonicalValueFromSessionEntry(entry)
  if (value <= 0) return null

  const volume =
    entry.metric === 'weight_and_reps'
      ? (entry.weight ?? 0) * (entry.reps ?? 0)
      : undefined

  return {
    benchmarkExerciseId: entry.benchmarkExerciseId,
    exerciseFamilyId: entry.exerciseFamilyId,
    prType: entry.prType,
    value,
    displayValue: formatPrValue(entry.prType, value),
    weight: entry.weight,
    reps: entry.reps,
    durationSeconds: entry.durationSeconds,
    distanceMeters: entry.distanceMeters,
    volume,
    notes: entry.notes,
  }
}

export function canonicalValueFromSessionEntry(entry: AssessmentSessionEntry): number {
  switch (entry.metric) {
    case 'reps':
      return entry.reps ?? 0
    case 'duration_seconds':
      return entry.durationSeconds ?? 0
    case 'distance_meters':
      return entry.distanceMeters ?? 0
    case 'weight_and_reps':
      return (entry.weight ?? 0) * (entry.reps ?? 0)
  }
}

export function buildDisplayValueFromSessionEntry(entry: AssessmentSessionEntry): string {
  const value = canonicalValueFromSessionEntry(entry)
  return formatPrValue(entry.prType, value)
}


export function findOfficialRecord(
  records: OfficialPersonalRecord[],
  exerciseId: string,
  prType: PrType,
): OfficialPersonalRecord | undefined {
  return records.find(
    (record) => record.exerciseId === exerciseId && record.prType === prType,
  )
}

export function isPrImprovement(
  newValue: number,
  currentValue: number | null | undefined,
): boolean {
  if (newValue <= 0) return false
  if (currentValue == null) return true
  return newValue > currentValue
}

/**
 * Apply PR updates from a completed assessment.
 * Baseline always establishes records; performance assessments only improve them.
 */
export function applyOfficialPrUpdates(input: {
  results: AssessmentResultEntry[]
  assessmentId: string
  assessmentKind: FitnessAssessmentKind
  assessmentDefinitionId: string
  heroDayKey: string
  achievedAt: string
  officialRecords: OfficialPersonalRecord[]
  prHistory: PersonalRecordHistoryEntry[]
  forceEstablish?: boolean
}): PrUpdateResult {
  let officialRecords = [...input.officialRecords]
  let prHistory = [...input.prHistory]
  const updatedRecordIds: string[] = []
  const historyEntryIds: string[] = []

  for (const result of input.results) {
    const existing = findOfficialRecord(
      officialRecords,
      result.benchmarkExerciseId,
      result.prType,
    )
    const newValue = canonicalValueFromEntry(result)
    const shouldUpdate =
      input.forceEstablish || input.assessmentKind === 'baseline'
        ? newValue > 0
        : isPrImprovement(newValue, existing?.currentValue)

    if (!shouldUpdate) continue

    const historyEntry: PersonalRecordHistoryEntry = {
      id: crypto.randomUUID(),
      exerciseId: result.benchmarkExerciseId,
      exerciseFamilyId: result.exerciseFamilyId,
      prType: result.prType,
      oldValue: existing?.currentValue ?? null,
      newValue,
      oldDisplayValue: existing?.displayValue ?? null,
      newDisplayValue: result.displayValue,
      achievedAt: input.achievedAt,
      heroDayKey: input.heroDayKey,
      assessmentId: input.assessmentId,
      assessmentKind: input.assessmentKind,
      assessmentDefinitionId: input.assessmentDefinitionId,
    }

    const officialRecord: OfficialPersonalRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      exerciseId: result.benchmarkExerciseId,
      exerciseFamilyId: result.exerciseFamilyId,
      prType: result.prType,
      currentValue: newValue,
      previousValue: existing?.currentValue ?? null,
      displayValue: result.displayValue,
      achievedAt: input.achievedAt,
      heroDayKey: input.heroDayKey,
      assessmentId: input.assessmentId,
      assessmentKind: input.assessmentKind,
    }

    if (existing) {
      officialRecords = officialRecords.map((record) =>
        record.id === existing.id ? officialRecord : record,
      )
    } else {
      officialRecords.push(officialRecord)
    }

    prHistory.push(historyEntry)
    updatedRecordIds.push(officialRecord.id)
    historyEntryIds.push(historyEntry.id)
  }

  return { officialRecords, prHistory, updatedRecordIds, historyEntryIds }
}

export function metricLabel(metric: BenchmarkMetric): string {
  switch (metric) {
    case 'reps':
      return 'Reps'
    case 'duration_seconds':
      return 'Duration (seconds)'
    case 'distance_meters':
      return 'Distance (meters)'
    case 'weight_and_reps':
      return 'Weight & reps'
  }
}
