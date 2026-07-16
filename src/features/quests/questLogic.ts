import type { CompletionRewardKey } from '@/data/completionRewards'
import {
  resolveCompletionRewards,
  type CompletionRewardClaims,
} from '@/features/quests/completionRewardLogic'
import { computeProgress } from '@/features/quests/questProgress'
import {
  isQuestActiveOn,
  questContributesToStreakOn,
} from '@/features/quests/questSchedule'
import {
  addDaysToDateKey,
  getActiveQuestDayKey,
  getStreakDayEndDeadline,
} from '@/features/quests/questDay'
import { getCurrentGameTime } from '@/lib/gameTime'
import { parseDateKey } from '@/lib/storage'
import { NON_NEGOTIABLE_SUBCATEGORIES } from '@/types/quest'
import type {
  NonNegotiableSubcategory,
  QuestDefinition,
  QuestState,
} from '@/types/quest'

export interface CategoryCompletionStatus {
  completed: number
  total: number
  allComplete: boolean
}

export interface StreakState {
  currentStreak: number
  lastNonNegotiableCompleteDate: string | null
}

export interface QuestCompletionResult {
  updatedQuests: QuestState[]
  streak: StreakState
  definition: QuestDefinition
  completionClaims: CompletionRewardClaims
  completionXp: number
  completionCurrency: number
}

export function mergeQuestStates(
  persisted: QuestState[],
  definitions: QuestDefinition[],
): QuestState[] {
  const persistedMap = new Map(persisted.map((q) => [q.id, q]))

  return definitions.map((definition) => ({
    id: definition.id,
    status: persistedMap.get(definition.id)?.status ?? 'available',
  }))
}

export function createQuestStates(
  definitions: QuestDefinition[],
): QuestState[] {
  return definitions.map((quest) => ({
    id: quest.id,
    status: 'available',
  }))
}

export function resetQuestsForPeriod(
  quests: QuestState[],
  definitions: QuestDefinition[],
  options: { resetDaily: boolean; resetWeekly: boolean },
): QuestState[] {
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))

  return quests.map((quest) => {
    const definition = definitionMap.get(quest.id)
    if (!definition) return quest

    const shouldReset =
      (options.resetDaily &&
        (definition.category === 'nonNegotiable' ||
          definition.category === 'dailyBonus')) ||
      (options.resetWeekly &&
        (definition.category === 'weekly' ||
          definition.category === 'weeklyBonus'))

    if (shouldReset && quest.status !== 'available') {
      return { ...quest, status: 'available' }
    }

    return quest
  })
}

export function findQuestDefinition(
  definitions: QuestDefinition[],
  id: string,
): QuestDefinition | undefined {
  return definitions.find((quest) => quest.id === id)
}

export function findQuestState(
  quests: QuestState[],
  id: string,
): QuestState | undefined {
  return quests.find((quest) => quest.id === id)
}

/** Resolves the completion-reward group a quest belongs to, if any. */
function getQuestRewardGroup(
  definition: QuestDefinition,
): CompletionRewardKey | null {
  if (definition.category === 'nonNegotiable') {
    return definition.subcategory ?? null
  }
  if (
    definition.category === 'weekly' ||
    definition.category === 'weeklyBonus' ||
    definition.category === 'special'
  ) {
    return definition.category
  }
  return null
}

/** Quests required for a given reward group today (optional/inactive/weekend-suspended excluded). */
function getRequiredQuestsForGroup(
  definitions: QuestDefinition[],
  group: CompletionRewardKey,
  now: Date,
): QuestDefinition[] {
  return definitions.filter((definition) => {
    if (getQuestRewardGroup(definition) !== group) return false

    if (definition.category === 'nonNegotiable') {
      return questContributesToStreakOn(definition, now)
    }

    return isQuestActiveOn(definition, now) && !definition.optional
  })
}

export function getGroupCompletionStatus(
  quests: QuestState[],
  definitions: QuestDefinition[],
  group: CompletionRewardKey,
  now: Date = getCurrentGameTime(),
): CategoryCompletionStatus {
  const requiredQuests = getRequiredQuestsForGroup(definitions, group, now)
  const { completed, total } = computeProgress(requiredQuests, quests)

  return {
    completed,
    total,
    allComplete: total > 0 && completed === total,
  }
}

/** All non-negotiable quests required today, across every subcategory. */
export function getNonNegotiableCompletionStatus(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): CategoryCompletionStatus {
  const required = definitions.filter((d) =>
    questContributesToStreakOn(d, now),
  )
  const { completed, total } = computeProgress(required, quests)

  return {
    completed,
    total,
    allComplete: total > 0 && completed === total,
  }
}

export interface NonNegotiableStatusBreakdown {
  overall: CategoryCompletionStatus
  subcategories: Record<NonNegotiableSubcategory, CategoryCompletionStatus>
}

/**
 * Streak-authoritative completion status for today's non-negotiables, both
 * overall and per subcategory — the input the Hero Card's Status ladder
 * (`getHeroStatus` in `heroPresentation.ts`) is built from. Reuses
 * `getGroupCompletionStatus`/`getNonNegotiableCompletionStatus` rather than
 * re-deriving "what's required today," so Hero Status can never drift from
 * the same rules that drive the streak and subcategory completion rewards.
 */
export function getNonNegotiableStatusBreakdown(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): NonNegotiableStatusBreakdown {
  const subcategories = NON_NEGOTIABLE_SUBCATEGORIES.reduce(
    (acc, subcategory) => {
      acc[subcategory] = getGroupCompletionStatus(
        quests,
        definitions,
        subcategory,
        now,
      )
      return acc
    },
    {} as Record<NonNegotiableSubcategory, CategoryCompletionStatus>,
  )

  return {
    overall: getNonNegotiableCompletionStatus(quests, definitions, now),
    subcategories,
  }
}

export {
  addDaysToDateKey,
  getActiveQuestDayKey,
  getStreakDayEndDeadline,
} from '@/features/quests/questDay'

/**
 * If the calendar day *after* the last successful Non-Negotiable day has
 * already ended (past that day's streak deadline) without being completed,
 * the streak breaks immediately to 0. Does not wait for the next successful
 * day to "restart at 1" before reflecting the break.
 */
function expireStreakIfDayEnded(
  streak: StreakState,
  definitions: QuestDefinition[],
  now: Date,
): StreakState {
  if (streak.currentStreak <= 0) return streak
  if (!streak.lastNonNegotiableCompleteDate) {
    return { currentStreak: 0, lastNonNegotiableCompleteDate: null }
  }

  const dayAfterLastComplete = addDaysToDateKey(
    streak.lastNonNegotiableCompleteDate,
    1,
  )
  const deadline = getStreakDayEndDeadline(dayAfterLastComplete, definitions)

  if (now.getTime() < deadline.getTime()) return streak

  return {
    currentStreak: 0,
    lastNonNegotiableCompleteDate: streak.lastNonNegotiableCompleteDate,
  }
}

/**
 * Resolves streak state from current quest completion and day-end expiry.
 * Called after every quest completion, on timed-quest evaluation, on period
 * resets, and on persistence rehydrate.
 *
 * Streak advances only when every non-negotiable quest required *today*
 * (weekday/weekend-aware) is complete. Daily bonus, weekly, and special
 * quests never affect it.
 *
 * Streak breaks to 0 as soon as the day after `lastNonNegotiableCompleteDate`
 * ends without being completed (Sleep grace deadline when Sleep is required
 * that day; otherwise midnight) — not later when a new streak is started.
 */
export function resolveStreakState(
  quests: QuestState[],
  definitions: QuestDefinition[],
  streak: StreakState,
  now: Date = getCurrentGameTime(),
): StreakState {
  streak = expireStreakIfDayEnded(streak, definitions, now)

  const today = getActiveQuestDayKey(definitions, now)
  const questDay = parseDateKey(today)
  const nonNegotiable = getNonNegotiableCompletionStatus(
    quests,
    definitions,
    questDay,
  )

  if (!nonNegotiable.allComplete) {
    // Clear a stale "completed today" marker left by legacy data or partial resets.
    if (streak.lastNonNegotiableCompleteDate === today) {
      return expireStreakIfDayEnded(
        {
          currentStreak: streak.currentStreak,
          lastNonNegotiableCompleteDate: null,
        },
        definitions,
        now,
      )
    }
    return streak
  }

  if (streak.lastNonNegotiableCompleteDate === today) {
    return streak
  }

  const yesterday = addDaysToDateKey(today, -1)

  const newStreak =
    streak.lastNonNegotiableCompleteDate === yesterday
      ? streak.currentStreak + 1
      : 1

  return {
    currentStreak: newStreak,
    lastNonNegotiableCompleteDate: today,
  }
}

/**
 * Processes a quest completion: marks quest done and resolves streak
 * and completion rewards. Returns null if the quest cannot be completed
 * (already terminal, unknown, or not active today).
 */
export function processQuestCompletion(
  questId: string,
  quests: QuestState[],
  definitions: QuestDefinition[],
  streak: StreakState,
  completionClaims: CompletionRewardClaims,
  now: Date = getCurrentGameTime(),
): QuestCompletionResult | null {
  const questState = findQuestState(quests, questId)
  const definition = findQuestDefinition(definitions, questId)

  const dayKey = getActiveQuestDayKey(definitions, now)
  const questDay = parseDateKey(dayKey)

  if (
    !questState ||
    !definition ||
    questState.status !== 'available' ||
    !isQuestActiveOn(definition, questDay)
  ) {
    return null
  }

  const updatedQuests = quests.map((quest) =>
    quest.id === questId ? { ...quest, status: 'completed' as const } : quest,
  )

  const completionRewards = resolveCompletionRewards(
    updatedQuests,
    definitions,
    completionClaims,
    now,
  )

  const updatedStreak = resolveStreakState(
    updatedQuests,
    definitions,
    streak,
    now,
  )

  return {
    updatedQuests,
    streak: updatedStreak,
    definition,
    completionClaims: completionRewards.claims,
    completionXp: completionRewards.totalXp,
    completionCurrency: completionRewards.totalCurrency,
  }
}
