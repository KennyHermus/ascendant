import { getStatValue } from '@/features/hero/heroLogic'
import { getHeroTitle } from '@/features/hero/heroTitle'
import { getNonNegotiableCompletionStatus } from '@/features/quests/questLogic'
import { getTodaysJourneyProgress } from '@/features/quests/questProgress'
import { getEffectiveCategory, isQuestActiveOn, questContributesToStreakOn } from '@/features/quests/questSchedule'
import { getLockedUnlocksByProximity } from '@/features/unlocks/unlockLogic'
import { getCurrentGameTime } from '@/lib/gameTime'
import { formatDateKey, parseDateKey } from '@/lib/storage'
import type { GameEvent } from '@/types/event'
import type { Hero } from '@/types/hero'
import { STAT_KEYS } from '@/types/hero'
import type { QuestDefinition, QuestState } from '@/types/quest'
import type { DayStartHeroSnapshot, SummarySnapshot, SummaryStatGrowth } from '@/types/summary'
import type { UnlockDefinition } from '@/types/unlock'

/**
 * The app's one named "day is over" marker quest — referenced by id only
 * here, and only because the product spec calls it out by name ("after the
 * Sleep quest is completed"). Everywhere else in this file, "is the day
 * over" is derived from the existing category/schedule structure, not
 * quest ids.
 */
const DAY_END_QUEST_ID = 'sleep'

/** Captures the hero baseline a new day starts from — the diff basis for "earned/grew today." */
export function captureDayStartSnapshot(hero: Hero): DayStartHeroSnapshot {
  return {
    stats: hero.stats,
    totalXpEarned: hero.lifetimeStats.totalXpEarned,
    totalGoldEarned: hero.lifetimeStats.totalGoldEarned,
  }
}

/**
 * Whether today's Daily Summary should be offered yet. Either condition is
 * sufficient on its own:
 *  - every non-negotiable quest required today has left the `available`
 *    state (completed or missed) — the same required-set streak resolution
 *    uses (`questContributesToStreakOn`), so this can't drift from it;
 *  - the Sleep quest specifically has been completed (the day's natural
 *    end, even if e.g. a daily bonus quest is still technically open).
 */
export function isDailySummaryAvailable(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): boolean {
  const questStatus = new Map(quests.map((q) => [q.id, q.status]))
  const requiredNonNegotiables = definitions.filter((d) => questContributesToStreakOn(d, now))

  const allNonNegotiablesResolved =
    requiredNonNegotiables.length > 0 &&
    requiredNonNegotiables.every((d) => questStatus.get(d.id) !== 'available')

  const dayEndQuestCompleted = questStatus.get(DAY_END_QUEST_ID) === 'completed'

  return allNonNegotiablesResolved || dayEndQuestCompleted
}

/**
 * Whether `summary` should still be surfaced on the dashboard right now.
 * A summary is meant to be checked in on repeatedly, not consumed once —
 * opening and closing it doesn't hide it — so this is purely a time
 * window, independent of `dailySummaryViewed`: visible from the moment
 * it's generated through the rest of its own day *and* all of the
 * following morning, only disappearing at noon the day after the summary's
 * `periodKey`. That gives a player who doesn't open the app until midday
 * a real chance to see how yesterday went before it's gone.
 */
export function isDailySummaryDisplayable(
  summary: SummarySnapshot,
  now: Date = getCurrentGameTime(),
): boolean {
  const cutoff = parseDateKey(summary.periodKey)
  cutoff.setDate(cutoff.getDate() + 1)
  return now.getTime() < cutoff.getTime()
}

interface ReflectionInputs {
  nonNegotiablesAllComplete: boolean
  questsCompletedToday: number
  workoutCompletedToday: boolean
  leveledUpToday: boolean
  streakIncreasedToday: boolean
  streakBrokenToday: boolean
}

/**
 * Short, rule-based recap line — deliberately simple templates, evaluated
 * most-notable-first, no AI. Extending this is just adding another branch;
 * nothing else in the pipeline needs to change.
 */
export function generateHeroReflection(input: ReflectionInputs): string {
  const {
    nonNegotiablesAllComplete,
    questsCompletedToday,
    workoutCompletedToday,
    leveledUpToday,
    streakIncreasedToday,
    streakBrokenToday,
  } = input

  if (leveledUpToday) {
    return 'You grew stronger today — a new level reached. Your dedication is paying off.'
  }
  if (workoutCompletedToday && nonNegotiablesAllComplete && streakIncreasedToday) {
    return 'A disciplined day — workout logged and your streak grew. Your consistency is becoming your greatest strength.'
  }
  if (workoutCompletedToday && nonNegotiablesAllComplete) {
    return 'You maintained your streak, trained hard, and grew stronger.'
  }
  if (workoutCompletedToday) {
    return 'You put in the work today. Every logged set moved you forward.'
  }
  if (nonNegotiablesAllComplete && streakIncreasedToday) {
    return 'A disciplined day. Your consistency is becoming your greatest strength.'
  }
  if (nonNegotiablesAllComplete) {
    return 'You maintained your streak and grew stronger.'
  }
  if (streakBrokenToday) {
    return 'The streak reset today, but every hero faces setbacks. Tomorrow is a new chance to begin again.'
  }
  if (questsCompletedToday > 0) {
    return "Today wasn't perfect, but every completed quest moved you forward."
  }
  return 'A quiet day. Tomorrow is a fresh start.'
}

function deriveReflectionInputs(
  todaysEvents: GameEvent[],
  nonNegotiablesAllComplete: boolean,
): ReflectionInputs {
  return {
    nonNegotiablesAllComplete,
    questsCompletedToday: todaysEvents.filter((e) => e.type === 'QUEST_COMPLETED').length,
    workoutCompletedToday: todaysEvents.some((e) => e.type === 'WORKOUT_COMPLETED'),
    leveledUpToday: todaysEvents.some((e) => e.type === 'LEVEL_UP'),
    streakIncreasedToday: todaysEvents.some((e) => e.type === 'STREAK_INCREASED'),
    streakBrokenToday: todaysEvents.some((e) => e.type === 'STREAK_BROKEN'),
  }
}

export interface GenerateDailySummaryInput {
  hero: Hero
  quests: QuestState[]
  questDefinitions: QuestDefinition[]
  unlockDefinitions: UnlockDefinition[]
  events: GameEvent[]
  streak: number
  dayStartSnapshot: DayStartHeroSnapshot
  /** Calendar day (`YYYY-MM-DD`) this summary covers. */
  periodKey: string
  /**
   * Reference time used for weekday/weekend-aware quest evaluation. For a
   * summary generated live, mid-day, this is simply "now." For one
   * finalized at the day-reset boundary, pass a time still *within*
   * `periodKey` (see `lib/storage.ts`'s `parseDateKey`) — real "now" may
   * already be past midnight into the next day by that point.
   */
  now: Date
}

/**
 * Composes hero state, quest progress, and the event log into a
 * `SummarySnapshot` for one day. Pure and side-effect free — callers
 * decide whether the result is just previewed (dev tools, or a live
 * mid-day check) or frozen into persisted state (the store, at the daily
 * reset boundary). This is the "daily" implementation of the summary
 * pipeline; a future `weeklySummaryLogic.ts`/`monthlySummaryLogic.ts` would
 * follow the same shape — take a period's worth of quest/hero/event state,
 * return a `SummarySnapshot` — without this file or its callers changing.
 */
export function generateDailySummary(input: GenerateDailySummaryInput): SummarySnapshot {
  const {
    hero,
    quests,
    questDefinitions,
    unlockDefinitions,
    events,
    streak,
    dayStartSnapshot,
    periodKey,
    now,
  } = input

  const todaysEvents = events
    .filter((event) => formatDateKey(new Date(event.timestamp)) === periodKey)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const journeyProgress = getTodaysJourneyProgress(quests, questDefinitions, now)

  const statGrowth: SummaryStatGrowth[] = STAT_KEYS.map((stat) => ({
    stat,
    amount: getStatValue(hero.stats, stat) - getStatValue(dayStartSnapshot.stats, stat),
  })).filter((entry) => entry.amount > 0)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tomorrowObjectives = questDefinitions
    .filter(
      (d) =>
        !d.optional &&
        isQuestActiveOn(d, tomorrow) &&
        getEffectiveCategory(d, tomorrow) === 'nonNegotiable',
    )
    .map((d) => d.name)

  const questStatus = new Map(quests.map((q) => [q.id, q.status]))
  const weeklyRemaining = questDefinitions
    .filter((d) => d.category === 'weekly' && questStatus.get(d.id) === 'available')
    .map((d) => d.name)

  const closeUnlocks = getLockedUnlocksByProximity(unlockDefinitions, quests, questDefinitions, now)
    .slice(0, 3)
    .map(({ status }) => status.definition.name)

  const nonNegotiablesAllComplete = getNonNegotiableCompletionStatus(
    quests,
    questDefinitions,
    now,
  ).allComplete

  return {
    period: 'daily',
    periodKey,
    heroName: hero.name,
    heroTitle: getHeroTitle(hero.level),
    heroLevel: hero.level,
    xpEarned: Math.max(0, hero.lifetimeStats.totalXpEarned - dayStartSnapshot.totalXpEarned),
    goldEarned: Math.max(0, hero.lifetimeStats.totalGoldEarned - dayStartSnapshot.totalGoldEarned),
    quests: {
      nonNegotiable: {
        completed: journeyProgress.nonNegotiable.completed,
        total: journeyProgress.nonNegotiable.total,
      },
      dailyBonus: journeyProgress.dailyBonus,
      weekly: journeyProgress.weekly,
      weeklyBonus: journeyProgress.weeklyBonus,
    },
    statGrowth,
    events: todaysEvents,
    streak,
    reflection: generateHeroReflection(deriveReflectionInputs(todaysEvents, nonNegotiablesAllComplete)),
    tomorrowPreview: {
      currentStreak: streak,
      objectives: tomorrowObjectives,
      weeklyRemaining,
      closeUnlocks,
    },
  }
}
