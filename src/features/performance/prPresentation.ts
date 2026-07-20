import { getBenchmarkExerciseName } from '@/features/performance/exerciseFamilyLogic'
import type {
  OfficialPersonalRecord,
  PersonalRecordHistoryEntry,
  PrType,
} from '@/types/performance'

export function formatPrTypeLabel(prType: PrType): string {
  switch (prType) {
    case 'highest_weight':
      return 'Highest Weight'
    case 'highest_reps':
      return 'Highest Repetitions'
    case 'longest_duration':
      return 'Longest Duration'
    case 'longest_distance':
      return 'Longest Distance'
    case 'highest_volume':
      return 'Highest Volume'
  }
}

export function formatOfficialPrSummary(record: OfficialPersonalRecord): string {
  const name = getBenchmarkExerciseName(record.exerciseId)
  return `${name} · ${formatPrTypeLabel(record.prType)} · ${record.displayValue}`
}

export function formatPrHistorySummary(entry: PersonalRecordHistoryEntry): string {
  const name = getBenchmarkExerciseName(entry.exerciseId)
  const from = entry.oldDisplayValue ?? '—'
  return `${name} · ${from} → ${entry.newDisplayValue}`
}

export function formatPersonalRecordTimelineLabel(input: {
  exerciseId: string
  prType: PrType
  previousDisplayValue: string | null
  newDisplayValue: string
}): string {
  const name = getBenchmarkExerciseName(input.exerciseId)
  const from = input.previousDisplayValue ?? '—'
  return `🏆 New Personal Record · ${name} · ${from} → ${input.newDisplayValue}`
}

export function formatPersonalRecordTimelineDetail(input: {
  exerciseId: string
  prType: PrType
}): string {
  return `${getBenchmarkExerciseName(input.exerciseId)} · ${formatPrTypeLabel(input.prType)}`
}
