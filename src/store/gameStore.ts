import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { QUEST_DEFINITIONS } from '@/data/quests'
import { UNLOCK_DEFINITIONS } from '@/data/unlocks'
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions'
import {
  applyAchievementRewards,
  createInitialAchievementStates,
  evaluateAchievements,
  forceUnlockAchievements,
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
  recordWorkoutCompleted,
} from '@/features/events/eventLogic'
import {
  buildDailySnapshot,
  createEmptyHistory,
  deleteLatestSnapshot,
  mergeHistory,
  recordDailySnapshot,
  resetHistory,
} from '@/features/history/historyLogic'
import { generateSampleHistory } from '@/features/history/historySample'
import { generateSampleInsightData } from '@/features/insights/insightsSample'
import {
  createEmptyQuestHistory,
  mergeQuestHistory,
  recordQuestCompletion as appendQuestCompletionRecord,
  recordQuestMiss as appendQuestMissRecord,
} from '@/features/questHistory/questHistoryLogic'
import { captureDayStartSnapshot, generateDailySummary, isDailySummaryAvailable } from '@/features/summary/dailySummaryLogic'
import { applyStatRewards, createInitialHero } from '@/features/hero/heroLogic'
import {
  createInitialLifetimeStats,
  recordBonusEarnings,
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
  freezeSimulatedGameTime,
  getCurrentGameTime,
  getHeroTimePersistedConfig,
  getSimulatedTimeOverride,
  restoreHeroTimeConfig,
  resumeSimulatedGameTimeProgression,
  setSimulatedGameTime,
} from '@/lib/gameTime'
import type { HeroTimePersistedConfig } from '@/lib/gameTime'
import { CURRENT_SAVE_VERSION } from '@/lib/migrations/migrations'
import { createMigratingStorage } from '@/lib/migrations/migratingStorage'
import { getActiveHeroDayKey } from '@/lib/timeService'
import { getTodayDateString, getWeekKey, parseDateKey, STORAGE_KEY } from '@/lib/storage'
import type { AchievementState } from '@/types/achievement'
import type { GameEvent } from '@/types/event'
import type { Hero } from '@/types/hero'
import type {
  NonNegotiableSubcategory,
  QuestCategory,
  QuestState,
} from '@/types/quest'
import type { HeroHistory } from '@/types/history'
import type { DayStartHeroSnapshot, SummarySnapshot } from '@/types/summary'
import type { UnlockState } from '@/types/unlock'
import type { WorkoutState } from '@/types/workout'
import {
  buildWorkoutActivityFromSession,
  createEmptyWorkoutState,
  createSetLog,
  getActiveSession,
  createSessionFromTemplate,
  getTemplateById,
  mergeWorkoutState,
} from '@/features/workout/workoutLogic'
import type { DurationActivityType } from '@/data/durationActivities'
import { canEnterWorkoutReview, canPerformSessionAction } from '@/features/workout/workoutSessionState'
import {
  buildDurationWorkoutActivityFromSession,
  createDurationSession,
  isDurationSession,
} from '@/features/workout/durationActivityLogic'
import {
  evaluateDurationActivityGrade,
  evaluateWorkoutActivityGrade,
  resolveDurationActivityQuests,
  resolveWorkoutQuests,
} from '@/features/workout/workoutQuestResolution'
import {
  cancelSessionState,
  computeExerciseTimerElapsedMs,
  createDefaultSessionTiming,
  enterSessionReview,
  finalizeSessionTimer,
  finalizeUntimedSetLog,
  markExerciseTimerTargetReached as markExerciseTimerTargetReachedState,
  pauseExerciseTimerState,
  pauseRestTimerState,
  pauseSessionTimer,
  resumeExerciseTimerState,
  resumeRestTimerState,
  resumeSessionFromReview,
  resumeSessionTimer,
  skipRestTimerState,
  startExerciseTimerState,
  startSessionTimer,
  stopExerciseTimerState,
  stopRestTimerState,
} from '@/features/workout/workoutTimingLogic'
import {
  addSetToExercise,
  cancelStaleSessions,
  removeSetFromExercise,
  toggleSetComplete,
  updateSessionInState,
  updateSetOnExercise,
} from '@/features/workout/workoutSessionLogic'
import { generateSampleWorkoutHistory } from '@/features/workout/workoutSample'

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
  /** Dev Hero Time mode + anchor — preferred persisted config (see `lib/gameTime.ts`). */
  devHeroTime: HeroTimePersistedConfig | null
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
   * `evaluateAchievements`. Re-evaluated after quest completion and after
   * any path that can change achievement-relevant hero state (e.g. `grantXp`
   * level-ups, `syncAchievements` on load).
   * (the moment any achievement-relevant stat can change) and once more
   * on rehydrate as a backfill safety net (`syncAchievements`).
   */
  achievements: AchievementState[]
  /**
   * Long-term History Foundation (v0.0.3) — append-only daily snapshots for
   * future Analytics. Distinct from the recent `events` buffer and from the
   * UI-facing `dailySummary`. See `docs/HISTORY.md`.
   */
  history: HeroHistory
  /**
   * Append-only per-quest completion / miss log for Quest Explorer and
   * punctuality analytics. Distinct from capped `events` and `history`.
   */
  questHistory: import('@/types/questHistory').QuestHistory
  /**
   * Fitness / Activity layer (v0.0.4) — templates, sessions, and completed
   * workout activities. Distinct from quest state; see `docs/ACTIVITIES.md`.
   */
  workout: WorkoutState
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
  createWorkoutSession: (templateId: string) => boolean
  startDurationActivity: (activityType: DurationActivityType) => boolean
  beginWorkout: () => boolean
  pauseWorkout: () => boolean
  resumeWorkout: () => boolean
  startWorkout: (templateId: string) => boolean
  cancelWorkout: () => void
  logWorkoutSet: (
    exerciseLogId: string,
    setId: string,
    weight?: number,
    reps?: number,
  ) => boolean
  toggleWorkoutSetComplete: (exerciseLogId: string, setId: string) => boolean
  addWorkoutSet: (
    exerciseLogId: string,
    weight?: number,
    reps?: number,
    rpe?: number,
  ) => boolean
  updateWorkoutSet: (
    exerciseLogId: string,
    setId: string,
    fields: { weight?: number; reps?: number; rpe?: number; completed?: boolean },
  ) => boolean
  removeWorkoutSet: (exerciseLogId: string, setId: string) => boolean
  completeWorkout: () => boolean
  enterWorkoutReview: () => boolean
  exitWorkoutReview: () => boolean
  resumeWorkoutFromReview: () => boolean
  startExerciseTimer: (exerciseLogId: string, setId: string) => boolean
  pauseExerciseTimer: () => boolean
  resumeExerciseTimer: () => boolean
  stopExerciseTimer: () => boolean
  markExerciseTimerTargetReached: () => boolean
  startRestTimer: () => boolean
  pauseRestTimer: () => boolean
  resumeRestTimer: () => boolean
  stopRestTimer: () => boolean
  skipRestTimer: () => boolean
  /** Sets the developer time override and persists it. No-ops outside DEV. */
  devSetSimulatedTime: (date: Date) => void
  /** Advances the developer time override by `ms` and persists it. No-ops outside DEV. */
  devAdvanceSimulatedTime: (ms: number) => void
  /** Freezes simulated Hero Time at the current instant. No-ops outside DEV. */
  devFreezeHeroTime: () => void
  /** Resumes simulated Hero Time progression from the frozen instant. No-ops outside DEV. */
  devResumeHeroTimeProgression: () => void
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
  /**
   * Dev-only: finalize a daily history snapshot for the active quest day from
   * current state. No-ops if that date already has a snapshot. No-ops outside DEV.
   */
  devRecordTodaySnapshot: () => boolean
  /** Dev-only: removes the chronologically latest daily snapshot. No-ops outside DEV. */
  devDeleteLatestSnapshot: () => void
  /** Dev-only: clears all history snapshots; does not touch quests/hero/events. No-ops outside DEV. */
  devResetHistory: () => void
  /** Dev-only: backfills synthetic daily snapshots for Hero History testing. No-ops outside DEV. */
  devGenerateSampleHistory: (days?: number) => number
  /**
   * Dev-only: backfills sample History + quest events so Insights has signal.
   * Mutates history and events only. No-ops outside DEV.
   */
  devGenerateSampleInsightData: (days?: number) => {
    snapshotsAdded: number
    eventsAdded: number
  }
  devCreateSampleWorkout: () => boolean
  devStartWorkout: (templateId?: string) => boolean
  devCompleteWorkout: () => boolean
  devGenerateWorkoutHistory: (days?: number) => number
  devClearWorkoutData: () => void
  devClearWorkoutHistory: () => void
  devDumpWorkoutState: () => WorkoutState
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
    devHeroTime: getHeroTimePersistedConfig(),
    events: [],
    dailySummary: null,
    dailySummaryViewed: false,
    dayStartHeroSnapshot: captureDayStartSnapshot(hero),
    achievements: createInitialAchievementStates(ACHIEVEMENT_DEFINITIONS),
    history: createEmptyHistory(),
    questHistory: createEmptyQuestHistory(),
    workout: createEmptyWorkoutState(),
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
        let questHistory = state.questHistory
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
          for (const event of missedEvents) {
            if (event.type !== 'QUEST_FAILED') continue
            questHistory = appendQuestMissRecord(questHistory, {
              questId: event.questId,
              heroDayKey: lastDailyResetDate,
              missedAt: event.timestamp,
            })
          }
          questsForReset = swept
        }

        const eventsWithMisses = appendEvents(state.events, missedEvents)
        const stateForReset: GameState = {
          ...state,
          quests: questsForReset,
          events: eventsWithMisses,
        }

        // Finalize ending-day Daily Summary + History snapshot only when
        // advancing (not when rewinding simulated time).
        let dailySummaryPatch: Partial<GameState> = {}
        let history = state.history
        if (advancingDaily && lastDailyResetDate) {
          dailySummaryPatch = finalizeDailySummaryForEndingDay(
            stateForReset,
            lastDailyResetDate,
          )
          // Build the history rollup from pre-reset state (and pre-roll
          // dayStartHeroSnapshot) so xp/gold deltas stay accurate.
          history = recordDailySnapshot(
            state.history,
            buildDailySnapshot({
              date: lastDailyResetDate,
              hero: state.hero,
              quests: questsForReset,
              questDefinitions: QUEST_DEFINITIONS,
              events: eventsWithMisses,
              streak: state.currentStreak,
              dayStartSnapshot: state.dayStartHeroSnapshot,
              now,
            }),
          )
        }

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
        const events = appendEvents(eventsWithMisses, [
          ...deriveStreakEvents(streakBefore, streakAfter, now),
        ])

        set({
          ...resetPatch,
          ...dailySummaryPatch,
          events,
          history,
          questHistory,
          workout: cancelStaleSessions(state.workout, today),
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
        const now = getCurrentGameTime()
        const { states, newlyUnlocked } = evaluateAchievements(
          ACHIEVEMENT_DEFINITIONS,
          state.achievements,
          {
            hero: state.hero,
            quests: state.quests,
            questDefinitions: QUEST_DEFINITIONS,
            currentStreak: state.currentStreak,
            now,
          },
        )

        if (states === state.achievements) return

        if (newlyUnlocked.length === 0) {
          set({ achievements: states })
          return
        }

        const { hero, levelsGained } = applyAchievementRewards(
          state.hero,
          newlyUnlocked,
        )
        const newEvents: GameEvent[] = newlyUnlocked.map((achievement) =>
          recordAchievementUnlocked(achievement, now),
        )
        if (levelsGained > 0) {
          newEvents.push(recordLevelUp(hero.level, now))
        }

        set({
          achievements: states,
          hero,
          events: appendEvents(state.events, newEvents),
        })
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
        set({
          devSimulatedTime: getSimulatedTimeOverride()?.toISOString() ?? null,
          devHeroTime: getHeroTimePersistedConfig(),
        })
      },

      devAdvanceSimulatedTime: (ms: number) => {
        if (!import.meta.env.DEV) return
        advanceSimulatedGameTime(ms)
        set({
          devSimulatedTime: getSimulatedTimeOverride()?.toISOString() ?? null,
          devHeroTime: getHeroTimePersistedConfig(),
        })
      },

      devFreezeHeroTime: () => {
        if (!import.meta.env.DEV) return
        freezeSimulatedGameTime()
        set({
          devSimulatedTime: getSimulatedTimeOverride()?.toISOString() ?? null,
          devHeroTime: getHeroTimePersistedConfig(),
        })
      },

      devResumeHeroTimeProgression: () => {
        if (!import.meta.env.DEV) return
        resumeSimulatedGameTimeProgression()
        set({
          devSimulatedTime: getSimulatedTimeOverride()?.toISOString() ?? null,
          devHeroTime: getHeroTimePersistedConfig(),
        })
      },

      devClearSimulatedTime: () => {
        if (!import.meta.env.DEV) return
        clearSimulatedGameTime()
        set({ devSimulatedTime: null, devHeroTime: getHeroTimePersistedConfig() })
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

        const state = get()
        const now = getCurrentGameTime()
        const { states, newlyUnlocked } = forceUnlockAchievements(
          ACHIEVEMENT_DEFINITIONS,
          state.achievements,
          now,
        )

        if (newlyUnlocked.length === 0) return

        // Same reward + event pipeline as a legitimate evaluate/unlock —
        // only the condition check is bypassed (that's the point of Unlock All).
        const { hero, levelsGained } = applyAchievementRewards(
          state.hero,
          newlyUnlocked,
        )
        const newEvents: GameEvent[] = newlyUnlocked.map((achievement) =>
          recordAchievementUnlocked(achievement, now),
        )
        if (levelsGained > 0) {
          newEvents.push(recordLevelUp(hero.level, now))
        }

        set({
          achievements: states,
          hero,
          events: appendEvents(state.events, newEvents),
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

        // Achievements are evaluated after quest completion (and also after
        // `grantXp` / `syncAchievements` when hero state changes without a
        // quest). Conditions that depend on today's quest state still land
        // here as the primary path.
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

        const questHistory = appendQuestCompletionRecord(state.questHistory, {
          questId: result.definition.id,
          heroDayKey: result.heroDayKey,
          completedAt: result.completedAt,
          grade: result.gradeResult.grade,
          minutesOffset: result.gradeResult.minutesOffset,
        })

        const newEvents: GameEvent[] = [
          ...missedEvents,
          recordQuestCompleted({
            definition: result.definition,
            heroDayKey: result.heroDayKey,
            completedAt: result.completedAt,
            grade: result.gradeResult.grade,
            minutesOffset: result.gradeResult.minutesOffset,
          }),
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
          questHistory,
          ...summaryPatch,
        })

        return true
      },

      createWorkoutSession: (templateId: string) => {
        const state = get()
        const now = getCurrentGameTime()
        const heroDayKey = getActiveHeroDayKey(now)

        if (getActiveSession(state.workout)) return false

        const template = getTemplateById(state.workout, templateId)
        if (!template) return false

        const sessionId = crypto.randomUUID()
        const { sections, exercises, circuitProgress } = createSessionFromTemplate(template)
        const timing = createDefaultSessionTiming()
        const session = {
          id: sessionId,
          templateId: template.id,
          templateName: template.name,
          activityStructure: 'exercise' as const,
          activityType: template.id,
          status: 'draft' as const,
          heroDayKey,
          questId: null,
          startedAt: null,
          endedAt: null,
          ...timing,
          sections,
          exercises,
          circuitProgress,
          notes: undefined,
          activityId: null,
        }

        set({
          workout: {
            ...state.workout,
            sessions: [...state.workout.sessions, session],
            activeSessionId: sessionId,
          },
        })
        return true
      },

      startDurationActivity: (activityType: DurationActivityType) => {
        const state = get()
        if (getActiveSession(state.workout)) return false

        const now = getCurrentGameTime()
        const heroDayKey = getActiveHeroDayKey(now)
        const sessionId = crypto.randomUUID()
        const session = createDurationSession(activityType, heroDayKey, sessionId)

        set({
          workout: {
            ...state.workout,
            sessions: [...state.workout.sessions, session],
            activeSessionId: sessionId,
          },
        })

        return get().beginWorkout()
      },

      beginWorkout: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || !canPerformSessionAction(session.status, 'start')) return false

        const now = getCurrentGameTime()
        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            startSessionTimer(current, now.toISOString()),
          ),
        })
        return true
      },

      pauseWorkout: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || !canPerformSessionAction(session.status, 'pause')) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            pauseSessionTimer(current),
          ),
        })
        return true
      },

      resumeWorkout: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || !canPerformSessionAction(session.status, 'resume')) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            resumeSessionTimer(current),
          ),
        })
        return true
      },

      enterWorkoutReview: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || !canEnterWorkoutReview(session)) {
          return false
        }

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            enterSessionReview(current),
          ),
        })
        return true
      },

      exitWorkoutReview: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || !canPerformSessionAction(session.status, 'back')) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            resumeSessionFromReview(current),
          ),
        })
        return true
      },

      resumeWorkoutFromReview: () => {
        return get().exitWorkoutReview()
      },

      startWorkout: (templateId: string) => {
        const created = get().createWorkoutSession(templateId)
        if (!created) return false
        return get().beginWorkout()
      },

      cancelWorkout: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || !canPerformSessionAction(session.status, 'cancel')) return

        set({
          workout: {
            ...updateSessionInState(state.workout, session.id, (current) =>
              cancelSessionState(current),
            ),
            activeSessionId: null,
          },
        })
      },

      logWorkoutSet: (exerciseLogId, setId, weight, reps) => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (
          !session ||
          !['in_progress', 'paused', 'ready_for_review'].includes(session.status)
        ) {
          return false
        }

        const template = getTemplateById(state.workout, session.templateId)
        if (!template) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            finalizeUntimedSetLog(current, template, exerciseLogId, setId, {
              ...(weight != null ? { weight } : {}),
              ...(reps != null ? { reps } : {}),
            }),
          ),
        })
        return true
      },

      toggleWorkoutSetComplete: (exerciseLogId, setId) => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            toggleSetComplete(current, exerciseLogId, setId),
          ),
        })
        return true
      },

      addWorkoutSet: (exerciseLogId, weight, reps, rpe) => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session) return false

        const setLog = createSetLog(crypto.randomUUID(), {
          weight,
          reps,
          rpe,
          completed: false,
        })

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            addSetToExercise(current, exerciseLogId, setLog),
          ),
        })
        return true
      },

      updateWorkoutSet: (exerciseLogId, setId, fields) => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            updateSetOnExercise(current, exerciseLogId, setId, {
              fields,
              completed: fields.completed,
            }),
          ),
        })
        return true
      },

      removeWorkoutSet: (exerciseLogId, setId) => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            removeSetFromExercise(current, exerciseLogId, setId),
          ),
        })
        return true
      },

      completeWorkout: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || !canPerformSessionAction(session.status, 'finish')) return false

        const now = getCurrentGameTime()
        const heroDayKey = getActiveHeroDayKey(now)
        const completedAt = now.toISOString()
        const durationBased = isDurationSession(session)

        let completionGrade: Exclude<import('@/types/completion').CompletionGrade, 'missed'> =
          'completed'
        let resolution = { resolvedQuestIds: [] as string[], primaryResolvedQuestId: null as string | null }

        if (durationBased) {
          resolution = resolveDurationActivityQuests(
            session.activityType,
            now,
            heroDayKey,
            QUEST_DEFINITIONS,
            (questId) => get().completeQuest(questId),
          )
          completionGrade = evaluateDurationActivityGrade(
            resolution.resolvedQuestIds,
            QUEST_DEFINITIONS,
            now,
            heroDayKey,
          )
        } else {
          completionGrade = evaluateWorkoutActivityGrade(
            session.templateId,
            QUEST_DEFINITIONS,
            now,
            heroDayKey,
          )
          resolution = resolveWorkoutQuests(
            session.templateId,
            QUEST_DEFINITIONS,
            (questId) => get().completeQuest(questId),
          )
        }

        const activityId = crypto.randomUUID()
        const endedSession = finalizeSessionTimer({
          ...session,
          status: 'completed' as const,
          endedAt: completedAt,
          activityId,
        })
        const activity = durationBased
          ? buildDurationWorkoutActivityFromSession(
              endedSession,
              activityId,
              completedAt,
              completionGrade,
              heroDayKey,
              resolution.primaryResolvedQuestId,
            )
          : buildWorkoutActivityFromSession(
              endedSession,
              activityId,
              completedAt,
              completionGrade,
              heroDayKey,
              resolution.primaryResolvedQuestId,
            )

        const latest = get()
        set({
          workout: {
            ...latest.workout,
            sessions: latest.workout.sessions.map((entry) =>
              entry.id === session.id ? endedSession : entry,
            ),
            activities: [...latest.workout.activities, activity],
            activeSessionId: null,
          },
          events: appendEvents(latest.events, [
            recordWorkoutCompleted({ activity, now }),
          ]),
        })

        return true
      },

      startExerciseTimer: (exerciseLogId, setId) => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session || session.status !== 'in_progress') return false
        const exercise = session.exercises.find((entry) => entry.id === exerciseLogId)
        const setLog = exercise?.sets.find((entry) => entry.id === setId)
        if (!exercise || !setLog) return false
        const planned =
          setLog.target?.plannedDurationSeconds ??
          exercise.target?.plannedDurationSeconds ??
          setLog.fields.durationSeconds
        if (planned == null || planned <= 0) return false

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            startExerciseTimerState(current, exerciseLogId, setId, planned),
          ),
        })
        return true
      },

      pauseExerciseTimer: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeExerciseTimer) return false
        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            pauseExerciseTimerState(current),
          ),
        })
        return true
      },

      resumeExerciseTimer: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeExerciseTimer) return false
        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            resumeExerciseTimerState(current),
          ),
        })
        return true
      },

      stopExerciseTimer: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeExerciseTimer) return false

        const template = getTemplateById(state.workout, session.templateId)
        if (!template) return false

        const actualSeconds = Math.max(
          0,
          Math.round(
            computeExerciseTimerElapsedMs(session.activeExerciseTimer) / 1000,
          ),
        )

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            stopExerciseTimerState(current, template, actualSeconds),
          ),
        })
        return true
      },

      markExerciseTimerTargetReached: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeExerciseTimer || session.activeExerciseTimer.targetReached) {
          return false
        }

        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            markExerciseTimerTargetReachedState(current),
          ),
        })
        return true
      },

      startRestTimer: () => false,

      pauseRestTimer: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeRestTimer) return false
        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            pauseRestTimerState(current),
          ),
        })
        return true
      },

      resumeRestTimer: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeRestTimer) return false
        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            resumeRestTimerState(current),
          ),
        })
        return true
      },

      stopRestTimer: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeRestTimer) return false
        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            stopRestTimerState(current),
          ),
        })
        return true
      },

      skipRestTimer: () => {
        const state = get()
        const session = getActiveSession(state.workout)
        if (!session?.activeRestTimer) return false
        set({
          workout: updateSessionInState(state.workout, session.id, (current) =>
            skipRestTimerState(current),
          ),
        })
        return true
      },

      grantXp: (amount: number) => {
        if (!import.meta.env.DEV || amount <= 0) return

        const state = get()
        const now = getCurrentGameTime()
        const { hero: leveledHero, levelsGained } = addXp(state.hero, amount)
        const heroWithLifetime: Hero = {
          ...leveledHero,
          lifetimeStats: recordBonusEarnings(leveledHero.lifetimeStats, {
            xpEarned: amount,
            goldEarned: 0,
          }),
        }

        // Level (and other hero-state) achievements must unlock here too —
        // not only inside `completeQuest`.
        const { states: achievements, newlyUnlocked } = evaluateAchievements(
          ACHIEVEMENT_DEFINITIONS,
          state.achievements,
          {
            hero: heroWithLifetime,
            quests: state.quests,
            questDefinitions: QUEST_DEFINITIONS,
            currentStreak: state.currentStreak,
            now,
          },
        )
        const { hero, levelsGained: bonusLevelsGained } = applyAchievementRewards(
          heroWithLifetime,
          newlyUnlocked,
        )

        const newEvents: GameEvent[] = newlyUnlocked.map((achievement) =>
          recordAchievementUnlocked(achievement, now),
        )
        if (levelsGained > 0) {
          newEvents.push(recordLevelUp(leveledHero.level, now))
        }
        if (bonusLevelsGained > 0) {
          newEvents.push(recordLevelUp(hero.level, now))
        }

        set({
          hero,
          achievements,
          events: appendEvents(state.events, newEvents),
        })
      },

      resetProgress: () => {
        set(createInitialState())
      },

      devRecordTodaySnapshot: () => {
        if (!import.meta.env.DEV) return false

        const state = get()
        const now = getCurrentGameTime()
        const date = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
        const before = state.history
        const next = recordDailySnapshot(
          before,
          buildDailySnapshot({
            date,
            hero: state.hero,
            quests: state.quests,
            questDefinitions: QUEST_DEFINITIONS,
            events: state.events,
            streak: state.currentStreak,
            dayStartSnapshot: state.dayStartHeroSnapshot,
            now,
          }),
        )

        if (next === before) return false
        set({ history: next })
        return true
      },

      devDeleteLatestSnapshot: () => {
        if (!import.meta.env.DEV) return
        set({ history: deleteLatestSnapshot(get().history) })
      },

      devResetHistory: () => {
        if (!import.meta.env.DEV) return
        set({ history: resetHistory() })
      },

      devGenerateSampleHistory: (days = 90) => {
        if (!import.meta.env.DEV) return 0

        const state = get()
        const now = getCurrentGameTime()
        const todayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
        const beforeCount = state.history.dailySnapshots.length
        const next = generateSampleHistory({
          history: state.history,
          hero: state.hero,
          days,
          todayKey,
          now,
        })

        set({ history: next })
        return next.dailySnapshots.length - beforeCount
      },

      devGenerateSampleInsightData: (days = 60) => {
        if (!import.meta.env.DEV) {
          return { snapshotsAdded: 0, eventsAdded: 0 }
        }

        const state = get()
        const now = getCurrentGameTime()
        const todayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
        const result = generateSampleInsightData({
          history: state.history,
          events: state.events,
          hero: state.hero,
          questDefinitions: QUEST_DEFINITIONS,
          todayKey,
          days,
        })

        set({ history: result.history, events: result.events })
        return {
          snapshotsAdded: result.snapshotsAdded,
          eventsAdded: result.eventsAdded,
        }
      },

      devCreateSampleWorkout: () => {
        if (!import.meta.env.DEV) return false
        return get().devStartWorkout('upper-body')
      },

      devStartWorkout: (templateId = 'upper-body') => {
        if (!import.meta.env.DEV) return false
        return get().startWorkout(templateId)
      },

      devCompleteWorkout: () => {
        if (!import.meta.env.DEV) return false
        const state = get()
        let session = getActiveSession(state.workout)
        if (!session) {
          if (!get().devStartWorkout('upper-body')) return false
          session = getActiveSession(get().workout)
        }
        if (!session) return false

        if (session.status === 'draft') {
          get().beginWorkout()
          session = getActiveSession(get().workout)
          if (!session) return false
        }

        for (const exercise of session.exercises) {
          for (const set of exercise.sets) {
            if (!set.completed) {
              get().logWorkoutSet(
                exercise.id,
                set.id,
                set.fields.weight ?? 135,
                set.fields.reps ?? 8,
              )
            }
          }
        }

        return get().completeWorkout()
      },

      devGenerateWorkoutHistory: (days = 30) => {
        if (!import.meta.env.DEV) return 0

        const state = get()
        const now = getCurrentGameTime()
        const todayKey = getActiveHeroDayKey(now)
        const before = state.workout.activities.length
        const result = generateSampleWorkoutHistory({
          workout: state.workout,
          todayKey,
          days,
          now,
        })

        set({
          workout: result.workout,
          events: appendEvents(state.events, result.events),
        })
        return result.workout.activities.length - before
      },

      devClearWorkoutData: () => {
        if (!import.meta.env.DEV) return
        set({ workout: createEmptyWorkoutState() })
      },

      devClearWorkoutHistory: () => {
        if (!import.meta.env.DEV) return
        const state = get()
        set({
          workout: {
            ...state.workout,
            activities: [],
            sessions: state.workout.sessions.filter(
              (session) => session.status !== 'completed',
            ),
          },
          events: state.events.filter((event) => event.type !== 'WORKOUT_COMPLETED'),
        })
      },

      devDumpWorkoutState: () => {
        return get().workout
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
        if (saved.devHeroTime) {
          restoreHeroTimeConfig(saved.devHeroTime)
        } else if (saved.devSimulatedTime) {
          const restored = new Date(saved.devSimulatedTime)
          if (!Number.isNaN(restored.getTime())) {
            restoreHeroTimeConfig({
              mode: 'simulated_running',
              simTimeIso: saved.devSimulatedTime,
              anchorWallMs: Date.now(),
            })
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
          devHeroTime: saved.devHeroTime ?? null,
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
          // Missing on any save from before v0.0.3 — empty history is safe;
          // the 0.0.2 → 0.0.3 migration also writes this field.
          history: mergeHistory(saved.history),
          questHistory: mergeQuestHistory(saved.questHistory),
          workout: mergeWorkoutState(saved.workout),
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
