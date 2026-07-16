import type { QuestCategory, QuestDefinition } from '@/types/quest'

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/** Whether a quest appears at all today (independent of its status). */
export function isQuestActiveOn(
  definition: QuestDefinition,
  date: Date,
): boolean {
  if (definition.schedule?.weekdaysOnly && isWeekend(date)) return false
  return true
}

/**
 * Whether a nonNegotiable quest currently contributes to the streak /
 * its subcategory completion bonus. Single source of truth for "is this
 * quest required today" — used by streak resolution, subcategory reward
 * evaluation, and quest list grouping alike, so none of them hardcode it.
 */
export function questContributesToStreakOn(
  definition: QuestDefinition,
  date: Date,
): boolean {
  if (!definition.contributesToStreak) return false
  if (definition.optional) return false
  if (!isQuestActiveOn(definition, date)) return false
  if (definition.schedule?.streakOnlyOnWeekdays && isWeekend(date)) {
    return false
  }
  return true
}

/**
 * The category a quest belongs to *today* for display/grouping purposes.
 * A nonNegotiable quest whose streak contribution is suspended today
 * (e.g. Learning/Work on weekends) is presented as dailyBonus.
 */
export function getEffectiveCategory(
  definition: QuestDefinition,
  date: Date,
): QuestCategory {
  if (
    definition.category === 'nonNegotiable' &&
    definition.schedule?.streakOnlyOnWeekdays &&
    isWeekend(date)
  ) {
    return 'dailyBonus'
  }
  return definition.category
}
