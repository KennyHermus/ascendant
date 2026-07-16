import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { QUEST_DEFINITIONS } from '@/data/quests'
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
import { sweepExpiredTimedQuests } from '@/features/quests/questTiming'
import { getCurrentGameTime } from '@/lib/gameTime'
import { CURRENT_SAVE_VERSION } from '@/lib/migrations/migrations'
import { createMigratingStorage } from '@/lib/migrations/migratingStorage'
import { getTodayDateString, getWeekKey, STORAGE_KEY } from '@/lib/storage'
import type { Hero } from '@/types/hero'
import type { QuestState } from '@/types/quest'

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
  }
}

function getStreakSnapshot(state: GameState): StreakState {
  return {
    currentStreak: state.currentStreak,
    lastNonNegotiableCompleteDate: state.lastNonNegotiableCompleteDate,
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
        const { lastDailyResetDate, lastWeeklyResetWeek, quests } = state

        const resetDaily = lastDailyResetDate !== today
        const resetWeekly = lastWeeklyResetWeek !== week

        if (!resetDaily && !resetWeekly) return

        const resetQuests = resetQuestsForPeriod(quests, QUEST_DEFINITIONS, {
          resetDaily,
          resetWeekly,
        })

        const resetClaims = resetCompletionClaims(state.completionRewardClaims, {
          resetDaily,
          resetWeekly,
        })

        const streak = resolveStreakState(
          resetQuests,
          QUEST_DEFINITIONS,
          getStreakSnapshot(state),
          now,
        )

        set({
          quests: resetQuests,
          completionRewardClaims: resetClaims,
          currentStreak: streak.currentStreak,
          lastNonNegotiableCompleteDate: streak.lastNonNegotiableCompleteDate,
          lastDailyResetDate: resetDaily ? today : lastDailyResetDate,
          lastWeeklyResetWeek: resetWeekly ? week : lastWeeklyResetWeek,
        })
      },

      evaluateTimedQuests: () => {
        const state = get()
        const sweptQuests = sweepExpiredTimedQuests(
          state.quests,
          QUEST_DEFINITIONS,
        )

        if (sweptQuests === state.quests) return

        set({ quests: sweptQuests })
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

        // Sweep first so a quest whose deadline just passed can't be
        // completed even if no evaluation event has fired yet.
        const sweptQuests = sweepExpiredTimedQuests(
          state.quests,
          QUEST_DEFINITIONS,
        )

        const result = processQuestCompletion(
          questId,
          sweptQuests,
          QUEST_DEFINITIONS,
          getStreakSnapshot(state),
          state.completionRewardClaims,
        )

        if (!result) {
          if (sweptQuests !== state.quests) {
            set({ quests: sweptQuests })
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

        set({
          hero: leveledHero,
          quests: result.updatedQuests,
          completionRewardClaims: result.completionClaims,
          currentStreak: result.streak.currentStreak,
          lastNonNegotiableCompleteDate:
            result.streak.lastNonNegotiableCompleteDate,
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
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.applyPeriodResets()
        state?.reconcileStreak()
        state?.evaluateTimedQuests()
      },
    },
  ),
)
