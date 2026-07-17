import type {
  QuestCompletionRecord,
  QuestHistory,
  QuestMissRecord,
} from '@/types/questHistory'
import { QUEST_HISTORY_SCHEMA_VERSION } from '@/types/questHistory'
import type { CompletionGrade } from '@/types/completion'

const MAX_COMPLETION_RECORDS = 2000
const MAX_MISS_RECORDS = 2000

export function createEmptyQuestHistory(): QuestHistory {
  return {
    schemaVersion: QUEST_HISTORY_SCHEMA_VERSION,
    completions: [],
    misses: [],
  }
}

export function mergeQuestHistory(
  persisted: QuestHistory | undefined | null,
): QuestHistory {
  if (!persisted || !Array.isArray(persisted.completions)) {
    return createEmptyQuestHistory()
  }
  return {
    schemaVersion: persisted.schemaVersion ?? QUEST_HISTORY_SCHEMA_VERSION,
    completions: [...persisted.completions],
    misses: Array.isArray(persisted.misses) ? [...persisted.misses] : [],
  }
}

export interface RecordCompletionInput {
  questId: string
  heroDayKey: string
  completedAt: string
  grade: Exclude<CompletionGrade, 'missed'>
  minutesOffset: number
}

export function recordQuestCompletion(
  history: QuestHistory,
  input: RecordCompletionInput,
): QuestHistory {
  const record: QuestCompletionRecord = {
    id: crypto.randomUUID(),
    questId: input.questId,
    heroDayKey: input.heroDayKey,
    completedAt: input.completedAt,
    grade: input.grade,
    minutesOffset: input.minutesOffset,
  }

  const completions = [...history.completions, record]
  if (completions.length > MAX_COMPLETION_RECORDS) {
    completions.splice(0, completions.length - MAX_COMPLETION_RECORDS)
  }

  return { ...history, completions }
}

export interface RecordMissInput {
  questId: string
  heroDayKey: string
  missedAt: string
}

export function recordQuestMiss(
  history: QuestHistory,
  input: RecordMissInput,
): QuestHistory {
  const already = history.misses.some(
    (m) => m.questId === input.questId && m.heroDayKey === input.heroDayKey,
  )
  if (already) return history

  const record: QuestMissRecord = {
    id: crypto.randomUUID(),
    questId: input.questId,
    heroDayKey: input.heroDayKey,
    missedAt: input.missedAt,
  }

  const misses = [...history.misses, record]
  if (misses.length > MAX_MISS_RECORDS) {
    misses.splice(0, misses.length - MAX_MISS_RECORDS)
  }

  return { ...history, misses }
}

export function getCompletionsForQuest(
  history: QuestHistory,
  questId: string,
): QuestCompletionRecord[] {
  return history.completions.filter((c) => c.questId === questId)
}

export function getMissesForQuest(
  history: QuestHistory,
  questId: string,
): QuestMissRecord[] {
  return history.misses.filter((m) => m.questId === questId)
}

export function getLastCompletion(
  history: QuestHistory,
  questId: string,
): QuestCompletionRecord | undefined {
  const records = getCompletionsForQuest(history, questId)
  if (records.length === 0) return undefined
  return records.reduce((latest, r) =>
    r.completedAt > latest.completedAt ? r : latest,
  )
}

export function getLastMiss(
  history: QuestHistory,
  questId: string,
): QuestMissRecord | undefined {
  const records = getMissesForQuest(history, questId)
  if (records.length === 0) return undefined
  return records.reduce((latest, r) =>
    r.missedAt > latest.missedAt ? r : latest,
  )
}
