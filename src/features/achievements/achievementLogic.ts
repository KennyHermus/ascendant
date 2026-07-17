import { addXp } from '@/features/progression/progressionLogic'
import { recordBonusEarnings } from '@/features/hero/lifetimeStats'
import { getNonNegotiableCompletionStatus } from '@/features/quests/questLogic'
import { getCategoryProgress } from '@/features/quests/questProgress'
import { getCurrentGameTime } from '@/lib/gameTime'
import type {
  AchievementCategory,
  AchievementCondition,
  AchievementDefinition,
  AchievementRarity,
  AchievementReward,
  AchievementState,
} from '@/types/achievement'
import type { Hero } from '@/types/hero'
import type { QuestDefinition, QuestState } from '@/types/quest'

/** Single source of truth for category display names, used by the Achievement Panel. */
export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  progression: 'Progression',
  consistency: 'Consistency',
  quests: 'Quests',
  exploration: 'Exploration',
  fitness: 'Fitness',
  learning: 'Learning',
  special: 'Special',
}

/** Achievement Points awarded per rarity tier — separate from XP/Gold; see `getAchievementSummary`. */
export const ACHIEVEMENT_RARITY_POINTS: Record<AchievementRarity, number> = {
  common: 5,
  uncommon: 10,
  rare: 25,
  epic: 50,
  legendary: 100,
}

export const ACHIEVEMENT_RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

/** Tailwind classes per rarity — presentation only, never affects unlock logic or rewards. */
export const ACHIEVEMENT_RARITY_STYLES: Record<
  AchievementRarity,
  { border: string; text: string; badge: string }
> = {
  common: {
    border: 'border-stone-600/50',
    text: 'text-stone-300',
    badge: 'border-stone-600/50 text-stone-400',
  },
  uncommon: {
    border: 'border-emerald-700/50',
    text: 'text-emerald-300',
    badge: 'border-emerald-700/50 text-emerald-400/80',
  },
  rare: {
    border: 'border-sky-700/50',
    text: 'text-sky-300',
    badge: 'border-sky-700/50 text-sky-400/80',
  },
  epic: {
    border: 'border-violet-700/50',
    text: 'text-violet-300',
    badge: 'border-violet-700/50 text-violet-400/80',
  },
  legendary: {
    border: 'border-amber-600/60',
    text: 'text-amber-300',
    badge: 'border-amber-600/60 text-amber-400/90',
  },
}

export interface AchievementEvaluationContext {
  hero: Hero
  quests: QuestState[]
  questDefinitions: QuestDefinition[]
  currentStreak: number
  now: Date
}

export interface AchievementProgress {
  current: number
  target: number
}

function sumQuestCompletionCounts(hero: Hero, questIds: string[]): number {
  return questIds.reduce(
    (sum, id) => sum + (hero.lifetimeStats.questCompletionCounts[id] ?? 0),
    0,
  )
}

/**
 * Whether every required (non-optional, active-today) quest in `category`
 * has been completed *today* — reuses the same streak-authoritative
 * completion status the streak/subcategory-reward system already computes
 * for `nonNegotiable`, and the generic progress aggregator for
 * `dailyBonus` (which has no optional quests to gate on), so this can
 * never drift from either.
 */
function isCategoryCompletedToday(
  category: 'nonNegotiable' | 'dailyBonus',
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  now: Date,
): boolean {
  if (category === 'nonNegotiable') {
    return getNonNegotiableCompletionStatus(quests, questDefinitions, now).allComplete
  }
  const progress = getCategoryProgress(quests, questDefinitions, 'dailyBonus', { now })
  return progress.total > 0 && progress.completed >= progress.total
}

function isConditionMet(
  condition: AchievementCondition,
  context: AchievementEvaluationContext,
): boolean {
  const { hero, quests, questDefinitions, now } = context

  switch (condition.type) {
    case 'heroLevel':
      return hero.level >= condition.level
    case 'longestStreak':
      return hero.lifetimeStats.longestStreak >= condition.days
    case 'totalQuestsCompleted':
      return hero.lifetimeStats.totalQuestsCompleted >= condition.count
    case 'questCompletionCount':
      return sumQuestCompletionCounts(hero, condition.questIds) >= condition.count
    case 'timedQuestCompleted': {
      const timedQuestIds = questDefinitions.filter((d) => d.timing).map((d) => d.id)
      return sumQuestCompletionCounts(hero, timedQuestIds) >= 1
    }
    case 'categoryCompletedInDay':
      return isCategoryCompletedToday(condition.category, quests, questDefinitions, now)
    case 'perfectDay':
      return (
        isCategoryCompletedToday('nonNegotiable', quests, questDefinitions, now) &&
        isCategoryCompletedToday('dailyBonus', quests, questDefinitions, now)
      )
  }
}

/**
 * Numeric current/target for conditions that have a natural fraction
 * (level, streak, completion counts) — `null` for the boolean-only
 * conditions (timed quest, category-completed-in-day, perfect day), which
 * the UI renders as plain locked/unlocked with no progress bar.
 */
export function getAchievementProgress(
  condition: AchievementCondition,
  context: AchievementEvaluationContext,
): AchievementProgress | null {
  const { hero } = context

  switch (condition.type) {
    case 'heroLevel':
      return { current: Math.min(hero.level, condition.level), target: condition.level }
    case 'longestStreak':
      return {
        current: Math.min(hero.lifetimeStats.longestStreak, condition.days),
        target: condition.days,
      }
    case 'totalQuestsCompleted':
      return {
        current: Math.min(hero.lifetimeStats.totalQuestsCompleted, condition.count),
        target: condition.count,
      }
    case 'questCompletionCount':
      return {
        current: Math.min(sumQuestCompletionCounts(hero, condition.questIds), condition.count),
        target: condition.count,
      }
    case 'timedQuestCompleted':
    case 'categoryCompletedInDay':
    case 'perfectDay':
      return null
  }
}

export interface AchievementEvaluationResult {
  states: AchievementState[]
  newlyUnlocked: AchievementDefinition[]
}

/**
 * Checks every not-yet-unlocked achievement's condition against `context`
 * and unlocks any that are newly met. Already-unlocked achievements are
 * never re-checked — the "never unlock twice" guarantee lives entirely in
 * this one early-return, not scattered across call sites. Returns the same
 * `states` array reference when nothing changed, so callers can skip a
 * `set()` cheaply (same pattern as `reconcileTimedQuestStatuses`).
 */
export function evaluateAchievements(
  definitions: AchievementDefinition[],
  states: AchievementState[],
  context: AchievementEvaluationContext,
): AchievementEvaluationResult {
  const stateMap = new Map(states.map((s) => [s.id, s]))
  const newlyUnlocked: AchievementDefinition[] = []
  let changed = false

  const nextStates = definitions.map((definition) => {
    const existing =
      stateMap.get(definition.id) ?? { id: definition.id, unlocked: false, unlockedAt: null }

    if (existing.unlocked) return existing

    if (isConditionMet(definition.condition, context)) {
      newlyUnlocked.push(definition)
      changed = true
      return { id: definition.id, unlocked: true, unlockedAt: context.now.toISOString() }
    }

    return existing
  })

  return { states: changed ? nextStates : states, newlyUnlocked }
}

/**
 * Marks every still-locked achievement as unlocked (DevTools "Unlock All").
 * Does not check conditions — callers must still run `applyAchievementRewards`
 * and emit `ACHIEVEMENT_UNLOCKED` events so the side-effects match a real unlock.
 */
export function forceUnlockAchievements(
  definitions: AchievementDefinition[],
  states: AchievementState[],
  now: Date = getCurrentGameTime(),
): AchievementEvaluationResult {
  const stateMap = new Map(states.map((s) => [s.id, s]))
  const newlyUnlocked: AchievementDefinition[] = []
  const unlockedAt = now.toISOString()

  const nextStates = definitions.map((definition) => {
    const existing =
      stateMap.get(definition.id) ?? {
        id: definition.id,
        unlocked: false,
        unlockedAt: null,
      }

    if (existing.unlocked) return existing

    newlyUnlocked.push(definition)
    return { id: definition.id, unlocked: true, unlockedAt }
  })

  if (newlyUnlocked.length === 0) {
    return { states, newlyUnlocked }
  }

  return { states: nextStates, newlyUnlocked }
}

/** "+25 XP, +5 Gold" — only formats the reward kinds that are actually implemented. */
export function formatAchievementRewards(rewards: AchievementReward[]): string {
  return rewards
    .map((reward) => {
      if (reward.type === 'xp') return `+${reward.amount} XP`
      if (reward.type === 'gold') return `+${reward.amount} Gold`
      return null
    })
    .filter((label): label is string => label !== null)
    .join(', ')
}

/**
 * Applies the XP/Gold from every achievement in `newlyUnlocked` to `hero`
 * in one pass — XP is routed through the real `addXp` leveling pipeline
 * (so achievement rewards can themselves trigger a level-up, with stat
 * gains applied exactly like quest-earned XP), and both are folded into
 * `lifetimeStats` via `recordBonusEarnings` (not `recordQuestCompletionStats`,
 * since this isn't a quest completion). `title`/`cosmeticBadge`/`item`/
 * `skillPoint` rewards are intentionally no-ops today — see `types/achievement.ts`.
 */
export function applyAchievementRewards(
  hero: Hero,
  newlyUnlocked: AchievementDefinition[],
): { hero: Hero; levelsGained: number } {
  if (newlyUnlocked.length === 0) return { hero, levelsGained: 0 }

  let totalXp = 0
  let totalGold = 0
  for (const achievement of newlyUnlocked) {
    for (const reward of achievement.reward) {
      if (reward.type === 'xp') totalXp += reward.amount
      if (reward.type === 'gold') totalGold += reward.amount
    }
  }

  const withGold: Hero =
    totalGold > 0 ? { ...hero, currency: hero.currency + totalGold } : hero

  const { hero: leveledHero, levelsGained } =
    totalXp > 0 ? addXp(withGold, totalXp) : { hero: withGold, levelsGained: 0 }

  return {
    hero: {
      ...leveledHero,
      lifetimeStats: recordBonusEarnings(leveledHero.lifetimeStats, {
        xpEarned: totalXp,
        goldEarned: totalGold,
      }),
    },
    levelsGained,
  }
}

export interface AchievementSummary {
  unlockedCount: number
  totalCount: number
  completionPercent: number
  pointsEarned: number
  totalPoints: number
}

/** Achievement Points/completion — always derived on demand from the (small, fixed-size) definition list, never persisted separately. */
export function getAchievementSummary(
  definitions: AchievementDefinition[],
  states: AchievementState[],
): AchievementSummary {
  const stateMap = new Map(states.map((s) => [s.id, s]))
  let unlockedCount = 0
  let pointsEarned = 0
  let totalPoints = 0

  for (const definition of definitions) {
    const points = ACHIEVEMENT_RARITY_POINTS[definition.rarity]
    totalPoints += points
    if (stateMap.get(definition.id)?.unlocked) {
      unlockedCount++
      pointsEarned += points
    }
  }

  const totalCount = definitions.length
  return {
    unlockedCount,
    totalCount,
    completionPercent: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
    pointsEarned,
    totalPoints,
  }
}

export function createInitialAchievementStates(
  definitions: AchievementDefinition[],
): AchievementState[] {
  return definitions.map((definition) => ({
    id: definition.id,
    unlocked: false,
    unlockedAt: null,
  }))
}

/**
 * Safe-defaults persisted achievement state against the current
 * definitions list — any definition missing from `persisted` (a save from
 * before it existed, or before this feature existed at all) initializes
 * locked, exactly like `mergeUnlockStates`. Definitions removed in a later
 * update are simply dropped, never causing a migration.
 */
export function mergeAchievementStates(
  persisted: AchievementState[] | undefined,
  definitions: AchievementDefinition[],
): AchievementState[] {
  const persistedMap = new Map((persisted ?? []).map((a) => [a.id, a]))

  return definitions.map((definition) => {
    const existing = persistedMap.get(definition.id)
    return {
      id: definition.id,
      unlocked: existing?.unlocked ?? false,
      unlockedAt: existing?.unlockedAt ?? null,
    }
  })
}

export function buildAchievementEvaluationContext(
  hero: Hero,
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  currentStreak: number,
  now: Date = getCurrentGameTime(),
): AchievementEvaluationContext {
  return { hero, quests, questDefinitions, currentStreak, now }
}
