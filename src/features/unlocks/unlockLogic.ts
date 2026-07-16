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
  /** Numeric progress, only present for `groupCompletion` requirements. */
  progress?: { completed: number; total: number }
}

export interface UnlockStatus {
  definition: UnlockDefinition
  unlocked: boolean
  requirements: UnlockRequirementStatus[]
}

function evaluateRequirement(
  requirement: UnlockRequirement,
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date,
): UnlockRequirementStatus {
  switch (requirement.type) {
    case 'questCompletion': {
      const met =
        quests.find((q) => q.id === requirement.questId)?.status ===
        'completed'
      const name =
        questDefinitions.find((d) => d.id === requirement.questId)?.name ??
        requirement.questId
      return {
        requirement,
        met,
        label: met ? `${name} complete` : `${name} incomplete`,
      }
    }
    case 'groupCompletion': {
      const status = getGroupCompletionStatus(
        quests,
        questDefinitions,
        requirement.group,
        now,
      )
      const label = GROUP_LABELS[requirement.group]
      return {
        requirement,
        met: status.allComplete,
        label: status.allComplete ? `${label} complete` : `${label} incomplete`,
        progress: { completed: status.completed, total: status.total },
      }
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
  return definition.requirements.every(
    (requirement) =>
      evaluateRequirement(requirement, quests, questDefinitions, now).met,
  )
}

/** Full status for display: overall unlocked state plus per-requirement labels/progress. */
export function getUnlockStatus(
  definition: UnlockDefinition,
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): UnlockStatus {
  const requirements = definition.requirements.map((requirement) =>
    evaluateRequirement(requirement, quests, questDefinitions, now),
  )

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

export interface UnlockProximity {
  status: UnlockStatus
  /** Requirements not yet met — `0` would mean unlocked, so this only ever contains locked entries. */
  unmet: UnlockRequirementStatus[]
}

/**
 * Every locked unlock, sorted fewest-unmet-requirements-first ("closest to
 * completion"). Shared by Active Objectives (which surfaces just the
 * single closest one) and the Daily Summary's Tomorrow Preview (which
 * surfaces a short list) — kept here rather than duplicated in either
 * consumer, since it's a straightforward composition of `getUnlockStatus`.
 */
export function getLockedUnlocksByProximity(
  definitions: UnlockDefinition[],
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): UnlockProximity[] {
  return definitions
    .map((definition) => getUnlockStatus(definition, quests, questDefinitions, now))
    .filter((status) => !status.unlocked)
    .map((status) => ({
      status,
      unmet: status.requirements.filter((r) => !r.met),
    }))
    .sort((a, b) => a.unmet.length - b.unmet.length)
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
