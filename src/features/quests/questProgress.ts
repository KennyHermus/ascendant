import { getEffectiveCategory, isQuestActiveOn } from '@/features/quests/questSchedule'
import { getCurrentGameTime } from '@/lib/gameTime'
import { NON_NEGOTIABLE_SUBCATEGORIES } from '@/types/quest'
import type {
  NonNegotiableSubcategory,
  QuestCategory,
  QuestDefinition,
  QuestState,
} from '@/types/quest'

/**
 * Generic quest-completion aggregation layer — the single place that turns
 * "a list of quest definitions + current quest state" into completed/total/
 * percent numbers. Intentionally has no opinion on streak eligibility or
 * reward claiming (that stays in `questLogic.ts`, which composes these
 * primitives with its own required-quest filtering); this file only counts
 * and groups. Built to be reused by any future feature that needs a
 * completion fraction for some slice of quests — Today's Journey today,
 * and later Daily Summary, Achievements, History, Analytics, and other
 * objective-prioritization systems.
 */
export interface ProgressStats {
  completed: number
  total: number
  percent: number
}

/** Core counting primitive — every other function here ultimately calls this. */
export function computeProgress(
  definitions: QuestDefinition[],
  quests: QuestState[],
): ProgressStats {
  const stateMap = new Map(quests.map((q) => [q.id, q.status]))
  const total = definitions.length
  const completed = definitions.filter(
    (d) => stateMap.get(d.id) === 'completed',
  ).length

  return {
    completed,
    total,
    percent: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
  }
}

/**
 * Optional quests (e.g. Breakfast) only start counting toward `completed`
 * once every *required* (non-optional) quest in `definitions` is already
 * done — before that point they're invisible to the fraction entirely, not
 * just excluded from the denominator. `total` is always just the required
 * count. Once required quests are fully done, `capAtTotal` decides whether
 * an extra optional completion is allowed to read as a bonus (e.g. "4 / 3")
 * or is clamped back down to "3 / 3".
 */
function computeGatedBonusProgress(
  definitions: QuestDefinition[],
  quests: QuestState[],
  { capAtTotal }: { capAtTotal: boolean },
): ProgressStats {
  const stateMap = new Map(quests.map((q) => [q.id, q.status]))
  const required = definitions.filter((d) => !d.optional)
  const optional = definitions.filter((d) => d.optional)

  const total = required.length
  const completedRequired = required.filter(
    (d) => stateMap.get(d.id) === 'completed',
  ).length
  const allRequiredComplete = total > 0 && completedRequired === total

  const completedOptional = allRequiredComplete
    ? optional.filter((d) => stateMap.get(d.id) === 'completed').length
    : 0

  const rawCompleted = completedRequired + completedOptional
  const completed = capAtTotal ? Math.min(rawCompleted, total) : rawCompleted

  return {
    completed,
    total,
    percent: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
  }
}

export type OptionalQuestHandling =
  | 'include'
  | 'exclude'
  | 'gatedBonus'
  | 'gatedBonusCapped'

export interface ProgressQueryOptions {
  /** Restrict to quests scheduled to appear today (`isQuestActiveOn`). Defaults to true. */
  activeOnly?: boolean
  /**
   * How `optional` quests (e.g. Breakfast) factor into the result:
   *  - `'include'` (default) — optional quests count fully, in both total
   *    and completed (e.g. Today's Journey's Daily Bonus/Weekly rows).
   *  - `'gatedBonus'` — optional quests don't count at all until every
   *    required quest in the set is done; once that happens, an extra
   *    optional completion is allowed to push `completed` past `total`
   *    (e.g. Nutrition reading "4 / 3" once Breakfast is eaten *and*
   *    Lunch/Dinner/Vitamins are all done — but still "1 / 3", not "1 / 2",
   *    if only Breakfast and Lunch are done).
   *  - `'gatedBonusCapped'` — the same gating rule as `'gatedBonus'`, but
   *    `completed` is clamped to `total` rather than allowed to exceed it
   *    (Today's Journey's overall Non-Negotiable row, kept simple/never
   *    "over 100%" even though its own subcategory rows can be).
   *  - `'exclude'` — optional quests are dropped entirely. Streak/reward
   *    eligibility (`questLogic.ts`'s `getGroupCompletionStatus` /
   *    `getNonNegotiableCompletionStatus`) has its own equivalent filtering
   *    and intentionally doesn't route through this flag — that's streak-
   *    specific business logic, not a generic aggregation concern.
   */
  optionalHandling?: OptionalQuestHandling
  now?: Date
}

function selectActiveDefinitions(
  definitions: QuestDefinition[],
  options: ProgressQueryOptions,
): { defs: QuestDefinition[]; now: Date } {
  const now = options.now ?? getCurrentGameTime()
  const defs = (options.activeOnly ?? true)
    ? definitions.filter((d) => isQuestActiveOn(d, now))
    : definitions
  return { defs, now }
}

function applyOptionalHandling(
  definitions: QuestDefinition[],
  quests: QuestState[],
  handling: OptionalQuestHandling,
): ProgressStats {
  switch (handling) {
    case 'exclude':
      return computeProgress(definitions.filter((d) => !d.optional), quests)
    case 'gatedBonus':
      return computeGatedBonusProgress(definitions, quests, { capAtTotal: false })
    case 'gatedBonusCapped':
      return computeGatedBonusProgress(definitions, quests, { capAtTotal: true })
    case 'include':
      return computeProgress(definitions, quests)
  }
}

/** Progress for every quest whose *effective* (weekend-aware) category matches. */
export function getCategoryProgress(
  quests: QuestState[],
  definitions: QuestDefinition[],
  category: QuestCategory,
  options: ProgressQueryOptions = {},
): ProgressStats {
  const { defs, now } = selectActiveDefinitions(definitions, options)
  return applyOptionalHandling(
    defs.filter((d) => getEffectiveCategory(d, now) === category),
    quests,
    options.optionalHandling ?? 'include',
  )
}

/** Progress for one non-negotiable subcategory (Morning Routine, Nutrition, Evening Routine, ...). */
export function getSubcategoryProgress(
  quests: QuestState[],
  definitions: QuestDefinition[],
  subcategory: NonNegotiableSubcategory,
  options: ProgressQueryOptions = {},
): ProgressStats {
  const { defs, now } = selectActiveDefinitions(definitions, options)
  return applyOptionalHandling(
    defs.filter(
      (d) =>
        getEffectiveCategory(d, now) === 'nonNegotiable' &&
        d.subcategory === subcategory,
    ),
    quests,
    options.optionalHandling ?? 'include',
  )
}

export interface SubcategoryProgress extends ProgressStats {
  subcategory: NonNegotiableSubcategory
}

export interface NonNegotiableProgress extends ProgressStats {
  subcategories: SubcategoryProgress[]
}

export interface TodaysJourneyProgress {
  nonNegotiable: NonNegotiableProgress
  dailyBonus: ProgressStats
  weekly: ProgressStats
  weeklyBonus: ProgressStats
  special: ProgressStats
}

/**
 * Dashboard-facing "Today's Journey" summary — a concrete composition of
 * the generic aggregation above across every quest category/subcategory.
 * Grouping is entirely data-driven off each quest's `category`/`subcategory`
 * fields and the shared `NON_NEGOTIABLE_SUBCATEGORIES` list — no quest IDs
 * or subcategory names are hardcoded here, so adding, removing, or moving
 * quests (or adding a new subcategory) updates this automatically.
 *
 * Non-Negotiable subcategories use `'gatedBonus'`: an optional quest (e.g.
 * Breakfast) doesn't count at all until every required quest *in that same
 * subcategory* is done — so having Breakfast and Lunch but not Dinner/
 * Vitamins still reads "1 / 3", not "2 / 3" (the optional completion isn't
 * a substitute for a required one). Once the subcategory's required quests
 * are all done, the optional completion becomes a visible bonus, e.g.
 * "4 / 3" for a fully-done Nutrition day with Breakfast also eaten.
 *
 * The overall Non-Negotiable row uses `'gatedBonusCapped'` instead — same
 * gating rule (evaluated across the whole category, not per subcategory),
 * but `completed` is clamped to `total` so the top-level fraction never
 * shows "over 100%" even when a subcategory beneath it does; keeps the
 * headline number simple while still letting the detail rows celebrate the
 * bonus.
 *
 * Weekend-suspended quests (Wake Up/Sleep, `weekdaysOnly`) aren't part of
 * any of this — `isQuestActiveOn` drops them from both `completed` and
 * `total` on weekends, same as everywhere else. Every other category
 * currently has no optional quests, so `'include'` (the default) is
 * equivalent there, but is used explicitly for clarity.
 */
export function getTodaysJourneyProgress(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): TodaysJourneyProgress {
  const subcategories: SubcategoryProgress[] = NON_NEGOTIABLE_SUBCATEGORIES.map(
    (subcategory) => ({
      subcategory,
      ...getSubcategoryProgress(quests, definitions, subcategory, {
        now,
        optionalHandling: 'gatedBonus',
      }),
    }),
  )

  return {
    nonNegotiable: {
      ...getCategoryProgress(quests, definitions, 'nonNegotiable', {
        now,
        optionalHandling: 'gatedBonusCapped',
      }),
      subcategories,
    },
    dailyBonus: getCategoryProgress(quests, definitions, 'dailyBonus', { now }),
    weekly: getCategoryProgress(quests, definitions, 'weekly', { now }),
    weeklyBonus: getCategoryProgress(quests, definitions, 'weeklyBonus', { now }),
    special: getCategoryProgress(quests, definitions, 'special', { now }),
  }
}
