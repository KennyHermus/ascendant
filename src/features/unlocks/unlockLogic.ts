import type { CompletionRewardKey } from '@/data/completionRewards'
import { getGroupCompletionStatus } from '@/features/quests/questLogic'
import { getCurrentGameTime } from '@/lib/gameTime'
import type { QuestDefinition, QuestState } from '@/types/quest'
import type { UnlockDefinition, UnlockRequirement, UnlockState } from '@/types/unlock'

const GROUP_LABELS: Record<CompletionRewardKey, string> = {
  morningRoutine: 'Morning Routine',
  nutrition: 'Nutrition',
  eveningRoutine: 'Evening Routine',
  weekly: 'Weekly quests',
  weeklyBonus: 'Weekly bonus quests',
  special: 'Special quests',
}

export interface UnlockRequirementStatus {
  requirement: UnlockRequirement
  met: boolean
  label: string
}

export interface UnlockStatus {
  definition: UnlockDefinition
  unlocked: boolean
  requirements: UnlockRequirementStatus[]
}

function checkRequirement(
  requirement: UnlockRequirement,
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date,
): boolean {
  switch (requirement.type) {
    case 'questCompletion':
      return (
        quests.find((q) => q.id === requirement.questId)?.status ===
        'completed'
      )
    case 'groupCompletion':
      return getGroupCompletionStatus(
        quests,
        questDefinitions,
        requirement.group,
        now,
      ).allComplete
  }
}

function describeRequirement(
  requirement: UnlockRequirement,
  questDefinitions: QuestDefinition[],
  met: boolean,
): string {
  switch (requirement.type) {
    case 'questCompletion': {
      const name =
        questDefinitions.find((d) => d.id === requirement.questId)?.name ??
        requirement.questId
      return met ? `${name} complete` : `${name} incomplete`
    }
    case 'groupCompletion': {
      const label = GROUP_LABELS[requirement.group]
      return met ? `${label} complete` : `${label} incomplete`
    }
  }
}

/** Whether every requirement for an unlock is currently met. */
export function checkUnlockRequirements(
  definition: UnlockDefinition,
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): boolean {
  return definition.requirements.every((requirement) =>
    checkRequirement(requirement, quests, questDefinitions, now),
  )
}

/** Full status for display: overall unlocked state plus per-requirement labels. */
export function getUnlockStatus(
  definition: UnlockDefinition,
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): UnlockStatus {
  const requirements = definition.requirements.map((requirement) => {
    const met = checkRequirement(requirement, quests, questDefinitions, now)
    return {
      requirement,
      met,
      label: describeRequirement(requirement, questDefinitions, met),
    }
  })

  return {
    definition,
    unlocked: requirements.every((r) => r.met),
    requirements,
  }
}

/**
 * Recomputes every unlock from current quest completion. Not a "claim
 * once" pattern — an unlock re-locks if its underlying quest requirement
 * reverts to incomplete (e.g. after a daily reset), matching the "earn
 * access each day" design intent. Call at the same points as
 * `reconcileTimedQuestStatuses`: load/rehydrate, period resets, and quest
 * completion.
 */
export function evaluateUnlocks(
  definitions: UnlockDefinition[],
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): UnlockState[] {
  return definitions.map((definition) => ({
    id: definition.id,
    unlocked: checkUnlockRequirements(definition, quests, questDefinitions, now),
  }))
}

export function createInitialUnlockStates(
  definitions: UnlockDefinition[],
): UnlockState[] {
  return definitions.map((definition) => ({
    id: definition.id,
    unlocked: false,
  }))
}

export function mergeUnlockStates(
  persisted: UnlockState[] | undefined,
  definitions: UnlockDefinition[],
): UnlockState[] {
  const persistedMap = new Map((persisted ?? []).map((u) => [u.id, u]))

  return definitions.map((definition) => ({
    id: definition.id,
    unlocked: persistedMap.get(definition.id)?.unlocked ?? false,
  }))
}
