import { EXERCISE_FAMILIES } from '@/data/exerciseFamilies'
import { LIFETIME_ACCOMPLISHMENT_DEFINITIONS } from '@/data/lifetimeAccomplishments'
import { HERO_IDENTITY_TITLE_DEFINITIONS } from '@/data/heroIdentityTitles'
import {
  computeSetReps,
} from '@/features/workout/workoutStatistics'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import type { Hero } from '@/types/hero'
import type {
  AccomplishmentCondition,
  HeroIdentityMetrics,
  HeroIdentityState,
  LifetimeAccomplishmentDefinition,
} from '@/types/heroIdentity'
import type { HeroHistory } from '@/types/history'
import type { PerformanceState } from '@/types/performance'
import type { QuestDefinition } from '@/types/quest'
import type { WorkoutActivity } from '@/types/workout'
import {
  HERO_IDENTITY_SCHEMA_VERSION,
  type HeroIdentityTitleDefinition,
} from '@/types/heroIdentity'

const LEARNING_QUEST_IDS = ['bible', 'read'] as const

const PUSH_UP_EXERCISE_IDS = new Set(
  EXERCISE_FAMILIES.find((family) => family.id === 'push-up-family')?.memberExerciseIds ?? [],
)

export function createInitialHeroIdentityState(): HeroIdentityState {
  return {
    schemaVersion: HERO_IDENTITY_SCHEMA_VERSION,
    unlockedAccomplishmentIds: [],
    unlockedTitleIds: [],
    activeTitleId: null,
  }
}

export function mergeHeroIdentityState(
  saved: HeroIdentityState | undefined,
): HeroIdentityState {
  if (!saved) return createInitialHeroIdentityState()
  return {
    ...createInitialHeroIdentityState(),
    ...saved,
    unlockedAccomplishmentIds: saved.unlockedAccomplishmentIds ?? [],
    unlockedTitleIds: saved.unlockedTitleIds ?? [],
  }
}

function sumLearningQuestCompletions(hero: Hero): number {
  const counts = hero.lifetimeStats.questCompletionCounts
  return LEARNING_QUEST_IDS.reduce((sum, questId) => sum + (counts[questId] ?? 0), 0)
}

export function countPushUpRepsFromWorkouts(activities: WorkoutActivity[]): number {
  let total = 0
  for (const activity of activities) {
    for (const exercise of activity.exercises) {
      if (!PUSH_UP_EXERCISE_IDS.has(exercise.exerciseId)) continue
      for (const set of exercise.sets) {
        total += computeSetReps(set)
      }
    }
  }
  return total
}

export function computeDaysActive(
  history: HeroHistory,
  todayKey: string,
  includeToday: boolean,
): number {
  const days = new Set(history.dailySnapshots.map((snapshot) => snapshot.date))
  if (includeToday) days.add(todayKey)
  return days.size
}

export interface HeroIdentityEvaluationInput {
  hero: Hero
  currentStreak: number
  history: HeroHistory
  workoutActivities: WorkoutActivity[]
  performance: PerformanceState
  questDefinitions: QuestDefinition[]
  now: Date
}

export function buildHeroIdentityMetrics(
  input: HeroIdentityEvaluationInput,
): HeroIdentityMetrics {
  const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
  const hasTodaySnapshot = input.history.dailySnapshots.some(
    (snapshot) => snapshot.date === todayKey,
  )

  return {
    totalQuestsCompleted: input.hero.lifetimeStats.totalQuestsCompleted,
    level: input.hero.level,
    workoutsCompleted: input.workoutActivities.length,
    pushUpReps: countPushUpRepsFromWorkouts(input.workoutActivities),
    daysActive: computeDaysActive(input.history, todayKey, !hasTodaySnapshot),
    longestStreak: Math.max(
      input.hero.lifetimeStats.longestStreak,
      input.currentStreak,
    ),
    personalRecords: input.performance.prHistory.length,
    learningQuestCompletions: sumLearningQuestCompletions(input.hero),
    currentStreak: input.currentStreak,
  }
}

function getConditionProgress(
  condition: AccomplishmentCondition,
  metrics: HeroIdentityMetrics,
): { current: number; target: number } {
  switch (condition.kind) {
    case 'total_quests':
      return { current: metrics.totalQuestsCompleted, target: condition.min }
    case 'level':
      return { current: metrics.level, target: condition.min }
    case 'workouts_completed':
      return { current: metrics.workoutsCompleted, target: condition.min }
    case 'push_up_reps':
      return { current: metrics.pushUpReps, target: condition.min }
    case 'days_active':
      return { current: metrics.daysActive, target: condition.min }
    case 'longest_streak':
      return { current: metrics.longestStreak, target: condition.min }
    case 'personal_records':
      return { current: metrics.personalRecords, target: condition.min }
    case 'learning_quest_completions':
      return { current: metrics.learningQuestCompletions, target: condition.min }
  }
}

export function isAccomplishmentConditionMet(
  condition: AccomplishmentCondition,
  metrics: HeroIdentityMetrics,
): boolean {
  const { current, target } = getConditionProgress(condition, metrics)
  return current >= target
}

export function getAccomplishmentProgress(
  definition: LifetimeAccomplishmentDefinition,
  metrics: HeroIdentityMetrics,
): { current: number; target: number } {
  return getConditionProgress(definition.condition, metrics)
}

function resolveAutoActiveTitleId(unlockedTitleIds: string[]): string | null {
  const unlocked = HERO_IDENTITY_TITLE_DEFINITIONS.filter((title) =>
    unlockedTitleIds.includes(title.id),
  )
  if (unlocked.length === 0) return null
  return unlocked.reduce((best, title) =>
    title.priority > best.priority ? title : best,
  ).id
}

export function resolveActiveHeroTitle(
  identity: HeroIdentityState,
): HeroIdentityTitleDefinition | null {
  if (identity.activeTitleId) {
    if (!identity.unlockedTitleIds.includes(identity.activeTitleId)) {
      // Manual selection pointed at a title that is no longer valid — fall through.
    } else {
      return (
        HERO_IDENTITY_TITLE_DEFINITIONS.find((title) => title.id === identity.activeTitleId) ??
        null
      )
    }
  }

  const autoId = resolveAutoActiveTitleId(identity.unlockedTitleIds)
  if (!autoId) return null
  return HERO_IDENTITY_TITLE_DEFINITIONS.find((title) => title.id === autoId) ?? null
}

export interface HeroIdentityEvaluationResult {
  identity: HeroIdentityState
  newlyUnlockedAccomplishments: LifetimeAccomplishmentDefinition[]
  newlyUnlockedTitles: HeroIdentityTitleDefinition[]
}

export function evaluateHeroIdentity(
  identity: HeroIdentityState,
  input: HeroIdentityEvaluationInput,
): HeroIdentityEvaluationResult {
  const metrics = buildHeroIdentityMetrics(input)
  const unlockedAccomplishmentSet = new Set(identity.unlockedAccomplishmentIds)
  const newlyUnlockedAccomplishments: LifetimeAccomplishmentDefinition[] = []

  for (const definition of LIFETIME_ACCOMPLISHMENT_DEFINITIONS) {
    if (unlockedAccomplishmentSet.has(definition.id)) continue
    if (!isAccomplishmentConditionMet(definition.condition, metrics)) continue
    unlockedAccomplishmentSet.add(definition.id)
    newlyUnlockedAccomplishments.push(definition)
  }

  const unlockedTitleSet = new Set(identity.unlockedTitleIds)
  const newlyUnlockedTitles: HeroIdentityTitleDefinition[] = []

  for (const title of HERO_IDENTITY_TITLE_DEFINITIONS) {
    if (unlockedTitleSet.has(title.id)) continue
    if (!unlockedAccomplishmentSet.has(title.requiredAccomplishmentId)) continue
    unlockedTitleSet.add(title.id)
    newlyUnlockedTitles.push(title)
  }

  const nextUnlockedAccomplishmentIds = [...unlockedAccomplishmentSet]
  const nextUnlockedTitleIds = [...unlockedTitleSet]

  const identityChanged =
    nextUnlockedAccomplishmentIds.length !== identity.unlockedAccomplishmentIds.length ||
    nextUnlockedTitleIds.length !== identity.unlockedTitleIds.length

  if (!identityChanged) {
    return {
      identity,
      newlyUnlockedAccomplishments: [],
      newlyUnlockedTitles: [],
    }
  }

  const nextIdentity: HeroIdentityState = {
    ...identity,
    unlockedAccomplishmentIds: nextUnlockedAccomplishmentIds,
    unlockedTitleIds: nextUnlockedTitleIds,
    // Leave `activeTitleId` null for auto-select until manual selection ships.
  }

  return {
    identity: nextIdentity,
    newlyUnlockedAccomplishments,
    newlyUnlockedTitles,
  }
}

export function getNextAccomplishmentTargets(
  identity: HeroIdentityState,
  metrics: HeroIdentityMetrics,
  limit = 3,
): Array<{
  definition: LifetimeAccomplishmentDefinition
  progress: number
  target: number
}> {
  const unlocked = new Set(identity.unlockedAccomplishmentIds)
  return LIFETIME_ACCOMPLISHMENT_DEFINITIONS.filter(
    (definition) => !unlocked.has(definition.id),
  )
    .map((definition) => {
      const { current, target } = getAccomplishmentProgress(definition, metrics)
      return {
        definition,
        progress: current,
        target,
        remaining: target - current,
      }
    })
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, limit)
    .map(({ definition, progress, target }) => ({ definition, progress, target }))
}

/** Seeds unlock progress from existing save data — no timeline events. */
export function backfillHeroIdentityState(
  identity: HeroIdentityState,
  input: HeroIdentityEvaluationInput,
): HeroIdentityState {
  return evaluateHeroIdentity(identity, input).identity
}
