import { getHeroDayEnd, getHeroDayStart, parseCalendarDateKey } from '@/lib/timeService'
import { evaluateCompletionGrade } from '@/features/quests/completionGradeLogic'
import { isDurationActivityType } from '@/data/durationActivities'
import type { QuestDefinition } from '@/types/quest'
import type { CompletionGrade } from '@/types/completion'

/** Evening walk window begins at 5:00 PM on the Hero Day calendar date. */
export const EVENING_WALK_START_HOUR = 17

/** Quest ids satisfied by completing a workout with the given template. */
export function resolveQuestIdsForTemplate(
  templateId: string,
  definitions: QuestDefinition[],
): string[] {
  return definitions
    .filter((definition) => definition.acceptedWorkoutTemplates?.includes(templateId))
    .map((definition) => definition.id)
}

export function primaryQuestDefinitionForTemplate(
  templateId: string,
  definitions: QuestDefinition[],
): QuestDefinition | undefined {
  const questIds = resolveQuestIdsForTemplate(templateId, definitions)
  return definitions.find((definition) => definition.id === questIds[0])
}

export function evaluateWorkoutActivityGrade(
  templateId: string,
  definitions: QuestDefinition[],
  now: Date,
  heroDayKey: string,
): Exclude<CompletionGrade, 'missed'> {
  const definition = primaryQuestDefinitionForTemplate(templateId, definitions)
  if (!definition) return 'completed'
  return evaluateCompletionGrade(definition, now, heroDayKey).grade
}

/**
 * Walk quests resolve by completion timestamp within Hero Day windows:
 * - Morning Walk: Hero Day start → 5:00 PM
 * - Evening Walk: 5:00 PM → Hero Day end
 */
export function getWalkQuestIdsForCompletion(
  completedAt: Date,
  heroDayKey: string,
): string[] {
  const dayStart = getHeroDayStart(heroDayKey)
  const dayEnd = getHeroDayEnd(heroDayKey)
  const calendarDay = parseCalendarDateKey(heroDayKey)
  const eveningStart = new Date(calendarDay)
  eveningStart.setHours(EVENING_WALK_START_HOUR, 0, 0, 0)

  const ts = completedAt.getTime()
  if (ts >= dayStart.getTime() && ts < eveningStart.getTime()) {
    return ['morning-walk']
  }
  if (ts >= eveningStart.getTime() && ts < dayEnd.getTime()) {
    return ['evening-walk']
  }
  return []
}

export function resolveDurationActivityQuestIds(
  activityType: string,
  completedAt: Date,
  heroDayKey: string,
): string[] {
  if (activityType === 'walk') {
    return getWalkQuestIdsForCompletion(completedAt, heroDayKey)
  }
  return []
}

export interface WorkoutQuestResolutionResult {
  resolvedQuestIds: string[]
  /** First quest that received rewards this completion, if any. */
  primaryResolvedQuestId: string | null
}

/**
 * Attempts to complete each quest matched by the template.
 * Already-completed quests are skipped without failing the workout.
 */
export function resolveWorkoutQuests(
  templateId: string,
  definitions: QuestDefinition[],
  completeQuest: (questId: string) => boolean,
): WorkoutQuestResolutionResult {
  const questIds = resolveQuestIdsForTemplate(templateId, definitions)
  const resolvedQuestIds: string[] = []

  for (const questId of questIds) {
    if (completeQuest(questId)) {
      resolvedQuestIds.push(questId)
    }
  }

  return {
    resolvedQuestIds,
    primaryResolvedQuestId: resolvedQuestIds[0] ?? null,
  }
}

/**
 * Resolves quests for duration-based activities (walk, run, etc.).
 * Walk uses time-of-day windows; other types can extend this function later.
 */
export function resolveDurationActivityQuests(
  activityType: string,
  completedAt: Date,
  heroDayKey: string,
  definitions: QuestDefinition[],
  completeQuest: (questId: string) => boolean,
): WorkoutQuestResolutionResult {
  if (!isDurationActivityType(activityType)) {
    return { resolvedQuestIds: [], primaryResolvedQuestId: null }
  }

  const questIds = resolveDurationActivityQuestIds(activityType, completedAt, heroDayKey)
  const resolvedQuestIds: string[] = []

  for (const questId of questIds) {
    if (definitions.some((definition) => definition.id === questId) && completeQuest(questId)) {
      resolvedQuestIds.push(questId)
    }
  }

  return {
    resolvedQuestIds,
    primaryResolvedQuestId: resolvedQuestIds[0] ?? null,
  }
}

export function evaluateDurationActivityGrade(
  resolvedQuestIds: string[],
  definitions: QuestDefinition[],
  completedAt: Date,
  heroDayKey: string,
): Exclude<CompletionGrade, 'missed'> {
  const primaryId = resolvedQuestIds[0]
  if (!primaryId) return 'completed'
  const definition = definitions.find((entry) => entry.id === primaryId)
  if (!definition?.timing) return 'completed'
  return evaluateCompletionGrade(definition, completedAt, heroDayKey).grade
}
