import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { QUEST_DEFINITIONS } from '@/data/quests'
import { UNLOCK_DEFINITIONS } from '@/data/unlocks'
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions'
import {
  applyAchievementRewards,
  createInitialAchievementStates,
  evaluateAchievements,
  mergeAchievementStates,
} from '@/features/achievements/achievementLogic'
import {
  appendEvents,
  deriveStreakEvents,
  findNewlyMissedQuestEvents,
  findNewlyUnlockedEvents,
  recordAchievementUnlocked,
  recordLevelUp,
  recordQuestCompleted,
} from '@/features/events/eventLogic'
import { captureDayStartSnapshot, generateDailySummary, isDailySummaryAvailable } from '@/features/summary/dailySummaryLogic'
import { applyStatRewards, createInitialHero } from '@/features/hero/heroLogic'
import {
  createInitialLifetimeStats,
  recordQuestCompletionStats,
  recordStreakForLifetimeStats,
} from '@/features/hero/lifetimeStats'
import { addXp } from '@/features/progression/progressionLogic'
import {
  createInitialCompletionClaims,
  resetCompletionClaims,
} from '@/features/quests/completionRewardLogic'
import {
  createQuestStates,
  getActiveQuestDayKey,
  mergeQuestStates,
  processQuestCompletion,
  resetQuestsForPeriod,
  resolveStreakState,
  type StreakState,
} from '@/features/quests/questLogic'
import {
  reconcileTimedQuestStatuses,
  reconcileTimedQuestStatusesForDay,
} from '@/features/quests/questTiming'
import {
  createInitialUnlockStates,
  evaluateUnlocks as evaluateUnlockStates,
  mergeUnlockStates,
} from '@/features/unlocks/unlockLogic'
import { resetAllQuestsForTesting } from '@/dev/devQuestActions'
import {
  advanceSimulatedGameTime,
  clearSimulatedGameTime,
  getCurrentGameTime,
  getSimulatedTimeOverride,
  setSimulatedGameTime,
} from '@/lib/gameTime'
import { CURRENT_SAVE_VERSION } from '@/lib/migrations/migrations'
import { createMigratingStorage } from '@/lib/migrations/migratingStorage'
import { getTodayDateString, getWeekKey, parseDateKey, STORAGE_KEY } from '@/lib/storage'
import type { AchievementState } from '@/types/achievement'
import type { GameEvent } from '@/types/event'
import type { Hero } from '@/types/hero'
import type {
  NonNegotiableSubcategory,
  QuestCategory,
  QuestState,
} from '@/types/quest'
import type { DayStartHeroSnapshot, SummarySnapshot } from '@/types/summary'
import type { UnlockState } from '@/types/unlock'

interface GameState {
  /** Aligned with the app/git version (e.g. "0.0.2"). Drives save migrations. */
  saveVersion: string
  hero: Hero
  quests: QuestState[]
  currentStreak: number
  /** Last calendar day every non-negotiable quest required that day was completed. */
  lastNonNegotiableCompleteDate: string | null
  /** Tracks which group completion bonuses have been claimed this period. */
  completionRewardClaims: ReturnType<typeof createInitialCompletionClaims>
  lastDailyResetDate: string | null
  lastWeeklyResetWeek: string | null
  /** Recomputed (not "claimed once") whenever relevant quests change. */
  unlocks: UnlockState[]
  /**
   * Developer time-simulation override, as an ISO string (or `null` for
   * real time). This is the single persisted source of truth for the
   * simulated clock — `lib/gameTime.ts`'s in-memory override is primed
   * from this field on rehydrate and kept in sync by the `dev*SimulatedTime`
   * actions below. Always `null` outside DEV.
   */
  devSimulatedTime: string | null
  /**
   * Lightweight internal history of meaningful gameplay moments (quest
   * completed/failed, level up, streak change, unlock earned). Foundation
   * for a future History/Analytics feature — currently only backs the
   * Dashboard's "Recent Progress" section. Bounded to the most recent
   * entries by `appendEvents`.
   */
  events: GameEvent[]
  /**
   * The most recently generated Daily Summary. While its `periodKey`
   * matches today, this is a *live* snapshot that keeps refreshing as the
   * day progresses; once a new day's reset runs, it's frozen — see
   * `syncDailySummaryPatch`/`finalizeDailySummaryForEndingDay` below — and
   * never recomputed again, so it always represents exactly what happened
   * that day.
   */
  dailySummary: SummarySnapshot | null
  /** Whether `dailySummary` (in its current `periodKey`) has been opened by the player. */
  dailySummaryViewed: boolean
  /** Hero baseline as of the start of the current day — the Daily Summary's "earned/grew today" diff basis. */
  dayStartHeroSnapshot: DayStartHeroSnapshot
  /**
   * Persisted per-achievement unlock record, one entry per
   * `ACHIEVEMENT_DEFINITIONS` id. Never re-locked once unlocked — see
   * `evaluateAchievements`. Re-evaluated inline inside `completeQuest`
   * (the moment any achievement-relevant stat can change) and once more
   * on rehydrate as a backfill safety net (`syncAchievements`).
   */
  achievements: AchievementState[]
}

interface GameActions {
  completeQuest: (questId: string) => boolean
  grantXp: (amount: number) => void
  resetProgress: () => void
  applyPeriodResets: () => void
  reconcileStreak: () => void
  /** Marks `available` timed quests past their deadline as `missed`. Call on
   * load, tab resume, and refresh — never on a background timer. */
  evaluateTimedQuests: () => void
  /** Recomputes unlock states from current quest completion. */
  evaluateUnlocks: () => void
  /**
   * Re-checks whether today's Daily Summary should exist/refresh yet.
   * Called on load/resume for correctness; `completeQuest` and
   * `evaluateTimedQuests` also do this inline after their own state
   * changes, since either can be what makes a summary newly available.
   */
  syncDailySummary: () => void
  /** Marks the current `dailySummary` as viewed. */
  viewDailySummary: () => void
  /**
   * Re-evaluates every achievement condition against current state and
   * applies rewards for any newly met. Call on load/resume for backfill
   * safety (e.g. a save that already satisfies a condition added in a
   * later update); `completeQuest` also does this inline after its own
   * state changes, since that's the only place achievement-relevant stats
   * actually change.
   */
  syncAchievements: () => void
  /** Sets the developer time override and persists it. No-ops outside DEV. */
  devSetSimulatedTime: (date: Date) => void
  /** Advances the developer time override by `ms` and persists it. No-ops outside DEV. */
  devAdvanceSimulatedTime: (ms: number) => void
  /** Clears the developer time override, returning to real time. No-ops outside DEV. */
  devClearSimulatedTime: () => void
  /**
   * Dev-only: completes every currently-available quest in a category
   * (optionally scoped to a subcategory) through the normal completion
   * pipeline — XP, gold, stats, streak, and unlocks all apply exactly as
   * if each quest were completed individually. No-ops outside DEV.
   */
  devCompleteGroup: (
    category: QuestCategory,
    subcategory?: NonNegotiableSubcategory,
  ) => void
  /** Dev-only: force-resets every quest to `available`, including Special. No-ops outside DEV. */
  devResetAllQuests: () => void
  /** Dev-only: force-resets daily-scoped quests/claims, bypassing the date gate. No-ops outside DEV. */
  devResetDailyQuests: () => void
  /** Dev-only: force-resets weekly-scoped quests/claims, bypassing the date gate. No-ops outside DEV. */
  devResetWeeklyQuests: () => void
  /** Dev-only: resets the streak counter and last-complete marker. No-ops outside DEV. */
  devResetStreak: () => void
  /** Dev-only: force-unlocks every achievement, without granting rewards, for UI testing. No-ops outside DEV. */
  devUnlockAllAchievements: () => void
  /** Dev-only: force-relocks every achievement, discarding progress. No-ops outside DEV. */
  devResetAchievements: () => void
}

type GameStore = GameState & GameActions

function createInitialState(): GameState {
  const hero = createInitialHero()

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    hero,
    quests: createQuestStates(QUEST_DEFINITIONS),
    currentStreak: 0,
    lastNonNegotiableCompleteDate: null,
    completionRewardClaims: createInitialCompletionClaims(),
    lastDailyResetDate: getTodayDateString(),
    lastWeeklyResetWeek: getWeekKey(),
    unlocks: createInitialUnlockStates(UNLOCK_DEFINITIONS),
    // Mirrors whatever time override is currently live in `gameTime.ts` (null
    // on first-ever load) so `resetProgress()` doesn't fight an active dev
    // time simulation — resetting player progress is orthogonal to it.
    devSimulatedTime: getSimulatedTimeOverride()?.toISOString() ?? null,
    events: [],
    dailySummary: null,
    dailySummaryViewed: false,
    dayStartHeroSnapshot: captureDayStartSnapshot(hero),
    achievements: createInitialAchievementStates(ACHIEVEMENT_DEFINITIONS),
  }
}

/**
 * Builds the `dailySummary`/`dailySummaryViewed` patch for a freshly
 * generated snapshot. `dailySummaryViewed` only resets to `false` when
 * `snapshot` starts a period distinct from whatever's currently stored —
 * i.e. the very first time a summary exists for that day. Refreshing the
 * *same* day's live snapshot (more quests completed since the last check)
 * or finalizing it at the reset boundary both preserve whatever viewed
 * state it already had, so viewing a summary can't be silently undone.
 */
function buildDailySummaryPatch(
  state: GameState,
  snapshot: SummarySnapshot,
): Pick<GameState, 'dailySummary' | 'dailySummaryViewed'> {
  const isNewPeriod =
    state.dailySummary === null || state.dailySummary.periodKey !== snapshot.periodKey

  return {
    dailySummary: snapshot,
    dailySummaryViewed: isNewPeriod ? false : state.dailySummaryViewed,
  }
}

/**
 * Live, same-day sync: if today's own availability conditions aren't met
 * yet, leave `dailySummary` exactly as-is — whether that's `null`, an
 * already-generated snapshot for today, or (most of the morning, on any
 * day after the first) still yesterday's frozen one. Once today's own
 * conditions *are* met, always (re)generate today's snapshot, which
 * naturally supersedes whatever was there before — a previous day's
 * summary is a `SummarySnapshot` value, not something this function
 * mutates in place, so there's no risk of corrupting it; `buildDailySummaryPatch`
 * is what decides whether that transition resets `dailySummaryViewed`.
 * Returns `null` when nothing should change.
 */
function syncDailySummaryPatch(
  state: GameState,
  now: Date,
): Pick<GameState, 'dailySummary' | 'dailySummaryViewed'> | null {
  if (!isDailySummaryAvailable(state.quests, QUEST_DEFINITIONS, now)) {
    return null
  }

  const today = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
  const snapshot = generateDailySummary({
    hero: state.hero,
    quests: state.quests,
    questDefinitions: QUEST_DEFINITIONS,
    unlockDefinitions: UNLOCK_DEFINITIONS,
    events: state.events,
    streak: state.currentStreak,
    dayStartSnapshot: state.dayStartHeroSnapshot,
    periodKey: today,
    now,
  })

  return buildDailySummaryPatch(state, snapshot)
}

/**
 * Finalizes the Daily Summary for the day that's about to be reset —
 * called from `applyPeriodResets` with the *pre-reset* state, before any
 * quest/streak/unlock fields are wiped for the new day. Always generates
 * (unlike `syncDailySummaryPatch`, this isn't gated by
 * `isDailySummaryAvailable` — an incomplete day still gets summarized
 * honestly) and also rolls `dayStartHeroSnapshot` forward, so the new
 * day's own summary-in-progress diffs from the correct baseline.
 */
function finalizeDailySummaryForEndingDay(
  state: GameState,
  endingDayKey: string,
): Pick<GameState, 'dailySummary' | 'dailySummaryViewed' | 'dayStartHeroSnapshot'> {
  const referenceTime = parseDateKey(endingDayKey)

  const snapshot = generateDailySummary({
    hero: state.hero,
    quests: state.quests,
    questDefinitions: QUEST_DEFINITIONS,
    unlockDefinitions: UNLOCK_DEFINITIONS,
    events: state.events,
    streak: state.currentStreak,
    dayStartSnapshot: state.dayStartHeroSnapshot,
    periodKey: endingDayKey,
    now: referenceTime,
  })

  return {
    ...buildDailySummaryPatch(state, snapshot),
    dayStartHeroSnapshot: captureDayStartSnapshot(state.hero),
  }
}

function getStreakSnapshot(state: GameState): StreakState {
  return {
    currentStreak: state.currentStreak,
    lastNonNegotiableCompleteDate: state.lastNonNegotiableCompleteDate,
  }
}

/**
 * Shared reset orchestration for daily/weekly quest+claim+streak+unlock
 * recomputation. Used by both the real, date-gated `applyPeriodResets` and
 * the forced dev-only reset actions, so the two paths can never drift.
 */
function computeResetPatch(
  state: GameState,
  options: { resetDaily: boolean; resetWeekly: boolean },
  now: Date = getCurrentGameTime(),
): Pick<
  GameState,
  'quests' | 'completionRewardClaims' | 'currentStreak' | 'lastNonNegotiableCompleteDate' | 'unlocks'
> {
  const resetQuests = resetQuestsForPeriod(state.quests, QUEST_DEFINITIONS, options)
  const resetClaims = resetCompletionClaims(state.completionRewardClaims, options)
  const streak = resolveStreakState(
    resetQuests,
    QUEST_DEFINITIONS,
    getStreakSnapshot(state),
    now,
  )
  const unlocks = evaluateUnlockStates(UNLOCK_DEFINITIONS, resetQuests, QUEST_DEFINITIONS, now)

  return {
    quests: resetQuests,
    completionRewardClaims: resetClaims,
    currentStreak: streak.currentStreak,
    lastNonNegotiableCompleteDate: streak.lastNonNegotiableCompleteDate,
    unlocks,
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      applyPeriodResets: () => {
        const now = getCurrentGameTime()
        const today = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
        const week = getWeekKey(now)
        const state = get()
        const { lastDailyResetDate, lastWeeklyResetWeek } = state

        const resetDaily = lastDailyResetDate !== today
        const resetWeekly = lastWeeklyResetWeek !== week

        if (!resetDaily && !resetWeekly) return

        // Only when the clock advances into a new quest day: sweep the ending
        // day's timed quests to `missed` and record historical QUEST_FAILED
        // events. Rewinding simulated time must not treat the abandoned
        // future day as "ended" or emit new miss events for it.
        const advancingDaily =
          resetDaily &&
          lastDailyResetDate !== null &&
          today > lastDailyResetDate

        let questsForReset = state.quests
        let missedEvents: ReturnType<typeof findNewlyMissedQuestEvents> = []
        if (advancingDaily && lastDailyResetDate) {
          const swept = reconcileTimedQuestStatusesForDay(
            state.quests,
            QUEST_DEFINITIONS,
            lastDailyResetDate,
            now,
          )
          missedEvents = findNewlyMissedQuestEvents(
            state.quests,
            swept,
            QUEST_DEFINITIONS,
            now,
            {
              periodKey: lastDailyResetDate,
              existingEvents: state.events,
            },
          )
          questsForReset = swept
        }

        const stateForReset: GameState = {
          ...state,
          quests: questsForReset,
        }

        // Finalize the ending day's summary only when advancing (not when
        // rewinding simulated time back into a prior quest day).
        const dailySummaryPatch =
          advancingDaily && lastDailyResetDate
            ? finalizeDailySummaryForEndingDay(stateForReset, lastDailyResetDate)
            : {}

        const streakBefore = getStreakSnapshot(state)
        const resetPatch = computeResetPatch(
          stateForReset,
          { resetDaily, resetWeekly },
          now,
        )
        const streakAfter: StreakState = {
          currentStreak: resetPatch.currentStreak,
          lastNonNegotiableCompleteDate: resetPatch.lastNonNegotiableCompleteDate,
        }
        const events = appendEvents(state.events, [
          ...missedEvents,
          ...deriveStreakEvents(streakBefore, streakAfter, now),
        ])

        set({
          ...resetPatch,
          ...dailySummaryPatch,
          events,
          lastDailyResetDate: resetDaily ? today : lastDailyResetDate,
          lastWeeklyResetWeek: resetWeekly ? week : lastWeeklyResetWeek,
        })
      },

      evaluateTimedQuests: () => {
        const state = get()
        const now = getCurrentGameTime()
        const dayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
        const reconciledQuests = reconcileTimedQuestStatuses(
          state.quests,
          QUEST_DEFINITIONS,
          now,
          dayKey,
        )

        const streakBefore = getStreakSnapshot(state)
        const streakAfter = resolveStreakState(
          reconciledQuests,
          QUEST_DEFINITIONS,
          streakBefore,
          now,
        )

        const questsChanged = reconciledQuests !== state.quests
        const streakChanged =
          streakAfter.currentStreak !== streakBefore.currentStreak ||
          streakAfter.lastNonNegotiableCompleteDate !==
            streakBefore.lastNonNegotiableCompleteDate

        if (!questsChanged && !streakChanged) return

        const missedEvents = questsChanged
          ? findNewlyMissedQuestEvents(
              state.quests,
              reconciledQuests,
              QUEST_DEFINITIONS,
              now,
              { periodKey: dayKey, existingEvents: state.events },
            )
          : []
        const streakEvents = deriveStreakEvents(streakBefore, streakAfter, now)
        const events = appendEvents(state.events, [...missedEvents, ...streakEvents])

        const summaryPatch = syncDailySummaryPatch(
          {
            ...state,
            quests: reconciledQuests,
            currentStreak: streakAfter.currentStreak,
            lastNonNegotiableCompleteDate: streakAfter.lastNonNegotiableCompleteDate,
            events,
          },
          now,
        )

        set({
          quests: reconciledQuests,
          currentStreak: streakAfter.currentStreak,
          lastNonNegotiableCompleteDate: streakAfter.lastNonNegotiableCompleteDate,
          events,
          ...summaryPatch,
        })
      },

      syncDailySummary: () => {
        const state = get()
        const summaryPatch = syncDailySummaryPatch(state, getCurrentGameTime())
        if (summaryPatch) set(summaryPatch)
      },

      viewDailySummary: () => {
        set({ dailySummaryViewed: true })
      },

      syncAchievements: () => {
        const state = get()
        const { states, newlyUnlocked } = evaluateAchievements(
          ACHIEVEMENT_DEFINITIONS,
          state.achievements,
          {
            hero: state.hero,
            quests: state.quests,
            questDefinitions: QUEST_DEFINITIONS,
            currentStreak: state.currentStreak,
            now: getCurrentGameTime(),
          },
        )

        if (states === state.achievements) return

        if (newlyUnlocked.length === 0) {
          set({ achievements: states })
          return
        }

        const { hero } = applyAchievementRewards(state.hero, newlyUnlocked)
        const events = appendEvents(
          state.events,
          newlyUnlocked.map((achievement) => recordAchievementUnlocked(achievement)),
        )

        set({ achievements: states, hero, events })
      },

      evaluateUnlocks: () => {
        const state = get()
        const unlocks = evaluateUnlockStates(
          UNLOCK_DEFINITIONS,
          state.quests,
          QUEST_DEFINITIONS,
        )

        const changed = unlocks.some(
          (unlock, index) => unlock.unlocked !== state.unlocks[index]?.unlocked,
        )
        if (!changed) return

        set({ unlocks })
      },

      devSetSimulatedTime: (date: Date) => {
        if (!import.meta.env.DEV) return
        setSimulatedGameTime(date)
        set({ devSimulatedTime: date.toISOString() })
      },

      devAdvanceSimulatedTime: (ms: number) => {
        if (!import.meta.env.DEV) return
        advanceSimulatedGameTime(ms)
        const updated = getSimulatedTimeOverride()
        set({ devSimulatedTime: updated ? updated.toISOString() : null })
      },

      devClearSimulatedTime: () => {
        if (!import.meta.env.DEV) return
        clearSimulatedGameTime()
        set({ devSimulatedTime: null })
      },

      devCompleteGroup: (category, subcategory) => {
        if (!import.meta.env.DEV) return

        const targets = QUEST_DEFINITIONS.filter(
          (definition) =>
            definition.category === category &&
            (!subcategory || definition.subcategory === subcategory),
        )

        // Route through the normal completion action one quest at a time —
        // each call re-reads fresh state, so XP/gold/stats/streak/unlocks
        // accumulate exactly as if every card were clicked by hand. Quests
        // that are already completed/missed/inactive today are silently
        // skipped by `completeQuest` itself.
        for (const definition of targets) {
          get().completeQuest(definition.id)
        }
      },

      devResetAllQuests: () => {
        if (!import.meta.env.DEV) return

        const state = get()
        const quests = resetAllQuestsForTesting(state.quests)
        const unlocks = evaluateUnlockStates(UNLOCK_DEFINITIONS, quests, QUEST_DEFINITIONS)

        set({
          quests,
          completionRewardClaims: createInitialCompletionClaims(),
          unlocks,
        })
      },

      devResetDailyQuests: () => {
        if (!import.meta.env.DEV) return
        set(computeResetPatch(get(), { resetDaily: true, resetWeekly: false }))
      },

      devResetWeeklyQuests: () => {
        if (!import.meta.env.DEV) return
        set(computeResetPatch(get(), { resetDaily: false, resetWeekly: true }))
      },

      devResetStreak: () => {
        if (!import.meta.env.DEV) return
        set({ currentStreak: 0, lastNonNegotiableCompleteDate: null })
      },

      devUnlockAllAchievements: () => {
        if (!import.meta.env.DEV) return
        const now = getCurrentGameTime().toISOString()
        set({
          achievements: ACHIEVEMENT_DEFINITIONS.map((definition) => ({
            id: definition.id,
            unlocked: true,
            unlockedAt: now,
          })),
        })
      },

      devResetAchievements: () => {
        if (!import.meta.env.DEV) return
        set({ achievements: createInitialAchievementStates(ACHIEVEMENT_DEFINITIONS) })
      },

      reconcileStreak: () => {
        const state = get()
        const now = getCurrentGameTime()
        const streakBefore = getStreakSnapshot(state)
        const streak = resolveStreakState(
          state.quests,
          QUEST_DEFINITIONS,
          streakBefore,
          now,
        )
        // Safety net, not the primary update path: `longestStreak` normally
        // advances inside `completeQuest` (the only place `currentStreak`
        // can actually increase). Re-checking the max here on every
        // rehydrate/reset costs nothing and keeps it correct even if a
        // future code path changes `currentStreak` some other way.
        const lifetimeStats = recordStreakForLifetimeStats(
          state.hero.lifetimeStats,
          streak.currentStreak,
        )

        const streakChanged =
          streak.currentStreak !== state.currentStreak ||
          streak.lastNonNegotiableCompleteDate !==
            state.lastNonNegotiableCompleteDate
        const lifetimeStatsChanged = lifetimeStats !== state.hero.lifetimeStats

        if (!streakChanged && !lifetimeStatsChanged) return

        const events = appendEvents(
          state.events,
          deriveStreakEvents(streakBefore, streak, now),
        )

        set({
          currentStreak: streak.currentStreak,
          lastNonNegotiableCompleteDate: streak.lastNonNegotiableCompleteDate,
          hero: lifetimeStatsChanged ? { ...state.hero, lifetimeStats } : state.hero,
          events,
        })
      },

      completeQuest: (questId: string) => {
        const state = get()

        // Reconcile first so a quest whose deadline just passed can't be
        // completed even if no evaluation event has fired yet (and, in dev
        // time simulation, so a quest rewound back before its deadline is
        // completable again rather than stuck `missed`).
        const now = getCurrentGameTime()
        const dayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
        const reconciledQuests = reconcileTimedQuestStatuses(
          state.quests,
          QUEST_DEFINITIONS,
          now,
          dayKey,
        )

        const missedEvents = findNewlyMissedQuestEvents(
          state.quests,
          reconciledQuests,
          QUEST_DEFINITIONS,
          now,
          { periodKey: dayKey, existingEvents: state.events },
        )

        const result = processQuestCompletion(
          questId,
          reconciledQuests,
          QUEST_DEFINITIONS,
          getStreakSnapshot(state),
          state.completionRewardClaims,
        )

        if (!result) {
          if (reconciledQuests !== state.quests || missedEvents.length > 0) {
            const events = appendEvents(state.events, missedEvents)
            const summaryPatch = syncDailySummaryPatch(
              { ...state, quests: reconciledQuests, events },
              getCurrentGameTime(),
            )

            set({
              quests: reconciledQuests,
              unlocks: evaluateUnlockStates(
                UNLOCK_DEFINITIONS,
                reconciledQuests,
                QUEST_DEFINITIONS,
              ),
              events,
              ...summaryPatch,
            })
          }
          return false
        }

        const withQuestRewards: Hero = {
          ...state.hero,
          currency: state.hero.currency + result.definition.currencyReward,
          stats: applyStatRewards(
            state.hero.stats,
            result.definition.statRewards,
          ),
        }

        const withCompletionRewards: Hero = {
          ...withQuestRewards,
          currency: withQuestRewards.currency + result.completionCurrency,
        }

        const totalXpEarned = result.definition.xpReward + result.completionXp
        const totalGoldEarned =
          result.definition.currencyReward + result.completionCurrency

        const { hero: leveledHero, levelsGained } = addXp(
          withCompletionRewards,
          totalXpEarned,
        )

        const heroWithLifetimeStats: Hero = {
          ...leveledHero,
          lifetimeStats: recordStreakForLifetimeStats(
            recordQuestCompletionStats(leveledHero.lifetimeStats, {
              questId: result.definition.id,
              xpEarned: totalXpEarned,
              goldEarned: totalGoldEarned,
            }),
            result.streak.currentStreak,
          ),
        }

        const unlocks = evaluateUnlockStates(
          UNLOCK_DEFINITIONS,
          result.updatedQuests,
          QUEST_DEFINITIONS,
        )

        // Achievements are evaluated right here rather than in a separate
        // pass — this is the one place every achievement-relevant stat
        // (level, streak, lifetime counts, today's category completion)
        // can actually change, satisfying "event-driven, don't scan every
        // achievement every render" without needing a dedicated event
        // subscription mechanism.
        const achievementEvaluationTime = getCurrentGameTime()
        const { states: achievements, newlyUnlocked } = evaluateAchievements(
          ACHIEVEMENT_DEFINITIONS,
          state.achievements,
          {
            hero: heroWithLifetimeStats,
            quests: result.updatedQuests,
            questDefinitions: QUEST_DEFINITIONS,
            currentStreak: result.streak.currentStreak,
            now: achievementEvaluationTime,
          },
        )
        const { hero: heroWithAchievementRewards, levelsGained: bonusLevelsGained } =
          applyAchievementRewards(heroWithLifetimeStats, newlyUnlocked)

        const newEvents: GameEvent[] = [
          ...missedEvents,
          recordQuestCompleted(result.definition),
          ...findNewlyUnlockedEvents(state.unlocks, unlocks, UNLOCK_DEFINITIONS),
          ...deriveStreakEvents(getStreakSnapshot(state), result.streak),
          ...newlyUnlocked.map((achievement) =>
            recordAchievementUnlocked(achievement, achievementEvaluationTime),
          ),
        ]
        if (levelsGained > 0) {
          newEvents.push(recordLevelUp(leveledHero.level))
        }
        if (bonusLevelsGained > 0) {
          newEvents.push(recordLevelUp(heroWithAchievementRewards.level))
        }

        const events = appendEvents(state.events, newEvents)
        const summaryPatch = syncDailySummaryPatch(
          {
            ...state,
            hero: heroWithAchievementRewards,
            quests: result.updatedQuests,
            currentStreak: result.streak.currentStreak,
            events,
          },
          getCurrentGameTime(),
        )

        set({
          hero: heroWithAchievementRewards,
          quests: result.updatedQuests,
          completionRewardClaims: result.completionClaims,
          currentStreak: result.streak.currentStreak,
          lastNonNegotiableCompleteDate:
            result.streak.lastNonNegotiableCompleteDate,
          unlocks,
          achievements,
          events,
          ...summaryPatch,
        })

        return true
      },

      grantXp: (amount: number) => {
        if (!import.meta.env.DEV || amount <= 0) return

        const { hero } = get()
        const { hero: leveledHero } = addXp(hero, amount)

        set({ hero: leveledHero })
      },

      resetProgress: () => {
        set(createInitialState())
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createMigratingStorage<GameStore>(),
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameState> | undefined
        if (!saved) return current

        // Prime the time provider's in-memory override *before* the
        // date-dependent streak resolution below (and everything
        // `onRehydrateStorage` runs afterward), so a refresh doesn't briefly
        // evaluate against real time before snapping back to simulated time.
        if (saved.devSimulatedTime) {
          const restored = new Date(saved.devSimulatedTime)
          if (!Number.isNaN(restored.getTime())) {
            setSimulatedGameTime(restored)
          }
        }

        const quests = mergeQuestStates(
          saved.quests ?? current.quests,
          QUEST_DEFINITIONS,
        )

        const streak = resolveStreakState(quests, QUEST_DEFINITIONS, {
          currentStreak: saved.currentStreak ?? current.currentStreak,
          lastNonNegotiableCompleteDate:
            saved.lastNonNegotiableCompleteDate ??
            current.lastNonNegotiableCompleteDate,
        })

        // `saved.hero.lifetimeStats` is undefined on any save from before
        // this feature existed — default it safely rather than bump the
        // save version, same pattern as `unlocks`/`events` below. Resolved
        // up front (rather than inline below) since `dayStartHeroSnapshot`'s
        // own fallback needs this same fully-defaulted hero, not the raw
        // (possibly incomplete) persisted one.
        const hero: Hero = saved.hero
          ? {
              ...saved.hero,
              // Spread the defaults first so a save whose `lifetimeStats`
              // predates a *later* addition to that shape (e.g.
              // `questCompletionCounts`, added after `lifetimeStats`
              // itself already existed) still gets that specific field
              // defaulted, not just the whole object.
              lifetimeStats: {
                ...createInitialLifetimeStats(),
                ...saved.hero.lifetimeStats,
              },
            }
          : current.hero

        return {
          ...current,
          ...saved,
          saveVersion: saved.saveVersion ?? CURRENT_SAVE_VERSION,
          hero,
          quests,
          completionRewardClaims:
            saved.completionRewardClaims ?? createInitialCompletionClaims(),
          currentStreak: streak.currentStreak,
          lastNonNegotiableCompleteDate:
            streak.lastNonNegotiableCompleteDate,
          // `saved.unlocks` is undefined on any save from before this
          // feature existed — mergeUnlockStates defaults it safely, and
          // evaluateUnlocks() below recomputes it correctly regardless.
          unlocks: mergeUnlockStates(saved.unlocks, UNLOCK_DEFINITIONS),
          // Missing on any save from before this feature existed —
          // defaults to real time, same safe-default pattern as `unlocks`.
          devSimulatedTime: saved.devSimulatedTime ?? null,
          // Missing on any save from before this feature existed — an empty
          // history is a safe default, same pattern as `unlocks`.
          events: saved.events ?? [],
          // Missing on any save from before this feature existed — no
          // pending summary is a safe default; `dayStartHeroSnapshot`
          // defaults to *today's* hero state (rather than triggering a
          // migration) since there's no way to know what it was at actual
          // day-start on an old save — the first summary after upgrading
          // may under-count that one day, which is an acceptable one-time
          // edge case for a dev-stage feature.
          dailySummary: saved.dailySummary ?? null,
          dailySummaryViewed: saved.dailySummaryViewed ?? false,
          dayStartHeroSnapshot:
            saved.dayStartHeroSnapshot ?? captureDayStartSnapshot(hero),
          // Missing on any save from before this feature existed —
          // mergeAchievementStates defaults it safely (all locked), and
          // syncAchievements() below backfills anything already earned.
          achievements: mergeAchievementStates(saved.achievements, ACHIEVEMENT_DEFINITIONS),
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.applyPeriodResets()
        state?.reconcileStreak()
        state?.evaluateTimedQuests()
        state?.evaluateUnlocks()
        state?.syncDailySummary()
        state?.syncAchievements()
      },
    },
  ),
)
