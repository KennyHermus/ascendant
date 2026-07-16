import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { QUEST_DEFINITIONS } from '@/data/quests'
import { UNLOCK_DEFINITIONS } from '@/data/unlocks'
import { applyStatRewards, createInitialHero } from '@/features/hero/heroLogic'
import { addXp } from '@/features/progression/progressionLogic'
import {
  createInitialCompletionClaims,
  resetCompletionClaims,
} from '@/features/quests/completionRewardLogic'
import {
  createQuestStates,
  mergeQuestStates,
  processQuestCompletion,
  resetQuestsForPeriod,
  resolveStreakState,
  type StreakState,
} from '@/features/quests/questLogic'
import { reconcileTimedQuestStatuses } from '@/features/quests/questTiming'
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
import { getTodayDateString, getWeekKey, STORAGE_KEY } from '@/lib/storage'
import type { Hero } from '@/types/hero'
import type {
  NonNegotiableSubcategory,
  QuestCategory,
  QuestState,
} from '@/types/quest'
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
}

type GameStore = GameState & GameActions

function createInitialState(): GameState {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    hero: createInitialHero(),
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
        const today = getTodayDateString()
        const week = getWeekKey(now)
        const state = get()
        const { lastDailyResetDate, lastWeeklyResetWeek } = state

        const resetDaily = lastDailyResetDate !== today
        const resetWeekly = lastWeeklyResetWeek !== week

        if (!resetDaily && !resetWeekly) return

        set({
          ...computeResetPatch(state, { resetDaily, resetWeekly }, now),
          lastDailyResetDate: resetDaily ? today : lastDailyResetDate,
          lastWeeklyResetWeek: resetWeekly ? week : lastWeeklyResetWeek,
        })
      },

      evaluateTimedQuests: () => {
        const state = get()
        const reconciledQuests = reconcileTimedQuestStatuses(
          state.quests,
          QUEST_DEFINITIONS,
        )

        if (reconciledQuests === state.quests) return

        set({ quests: reconciledQuests })
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

      reconcileStreak: () => {
        const state = get()
        const streak = resolveStreakState(
          state.quests,
          QUEST_DEFINITIONS,
          getStreakSnapshot(state),
        )

        if (
          streak.currentStreak === state.currentStreak &&
          streak.lastNonNegotiableCompleteDate ===
            state.lastNonNegotiableCompleteDate
        ) {
          return
        }

        set({
          currentStreak: streak.currentStreak,
          lastNonNegotiableCompleteDate: streak.lastNonNegotiableCompleteDate,
        })
      },

      completeQuest: (questId: string) => {
        const state = get()

        // Reconcile first so a quest whose deadline just passed can't be
        // completed even if no evaluation event has fired yet (and, in dev
        // time simulation, so a quest rewound back before its deadline is
        // completable again rather than stuck `missed`).
        const reconciledQuests = reconcileTimedQuestStatuses(
          state.quests,
          QUEST_DEFINITIONS,
        )

        const result = processQuestCompletion(
          questId,
          reconciledQuests,
          QUEST_DEFINITIONS,
          getStreakSnapshot(state),
          state.completionRewardClaims,
        )

        if (!result) {
          if (reconciledQuests !== state.quests) {
            set({
              quests: reconciledQuests,
              unlocks: evaluateUnlockStates(
                UNLOCK_DEFINITIONS,
                reconciledQuests,
                QUEST_DEFINITIONS,
              ),
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

        const { hero: leveledHero } = addXp(
          withCompletionRewards,
          result.definition.xpReward + result.completionXp,
        )

        const unlocks = evaluateUnlockStates(
          UNLOCK_DEFINITIONS,
          result.updatedQuests,
          QUEST_DEFINITIONS,
        )

        set({
          hero: leveledHero,
          quests: result.updatedQuests,
          completionRewardClaims: result.completionClaims,
          currentStreak: result.streak.currentStreak,
          lastNonNegotiableCompleteDate:
            result.streak.lastNonNegotiableCompleteDate,
          unlocks,
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

        return {
          ...current,
          ...saved,
          saveVersion: saved.saveVersion ?? CURRENT_SAVE_VERSION,
          hero: saved.hero ?? current.hero,
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
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.applyPeriodResets()
        state?.reconcileStreak()
        state?.evaluateTimedQuests()
        state?.evaluateUnlocks()
      },
    },
  ),
)
