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
} from '@/features/quests/questLogic'
import {
  getTodayDateString,
  getWeekKey,
  STORAGE_KEY,
} from '@/lib/storage'
import type { Hero } from '@/types/hero'
import type { QuestState } from '@/types/quest'

interface GameState {
  hero: Hero
  quests: QuestState[]
  currentStreak: number
  /** Last calendar day all daily core quests were completed (streak qualifier). */
  lastDailyCoreCompleteDate: string | null
  /** Tracks which category completion bonuses have been claimed this period. */
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
}

type GameStore = GameState & GameActions

function createInitialState(): GameState {
  return {
    hero: createInitialHero(),
    quests: createQuestStates(QUEST_DEFINITIONS),
    currentStreak: 0,
    lastDailyCoreCompleteDate: null,
    completionRewardClaims: createInitialCompletionClaims(),
    lastDailyResetDate: getTodayDateString(),
    lastWeeklyResetWeek: getWeekKey(),
  }
}

function getStreakSnapshot(state: GameState) {
  return {
    currentStreak: state.currentStreak,
    lastDailyCoreCompleteDate: state.lastDailyCoreCompleteDate,
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      applyPeriodResets: () => {
        const today = getTodayDateString()
        const week = getWeekKey()
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
          today,
        )

        set({
          quests: resetQuests,
          completionRewardClaims: resetClaims,
          currentStreak: streak.currentStreak,
          lastDailyCoreCompleteDate: streak.lastDailyCoreCompleteDate,
          lastDailyResetDate: resetDaily ? today : lastDailyResetDate,
          lastWeeklyResetWeek: resetWeekly ? week : lastWeeklyResetWeek,
        })
      },

      reconcileStreak: () => {
        const state = get()
        const today = getTodayDateString()
        const streak = resolveStreakState(
          state.quests,
          QUEST_DEFINITIONS,
          getStreakSnapshot(state),
          today,
        )

        if (
          streak.currentStreak === state.currentStreak &&
          streak.lastDailyCoreCompleteDate === state.lastDailyCoreCompleteDate
        ) {
          return
        }

        set({
          currentStreak: streak.currentStreak,
          lastDailyCoreCompleteDate: streak.lastDailyCoreCompleteDate,
        })
      },

      completeQuest: (questId: string) => {
        const state = get()
        const today = getTodayDateString()

        const result = processQuestCompletion(
          questId,
          state.quests,
          QUEST_DEFINITIONS,
          getStreakSnapshot(state),
          state.completionRewardClaims,
          today,
        )

        if (!result) return false

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
          lastDailyCoreCompleteDate: result.streak.lastDailyCoreCompleteDate,
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
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameState> | undefined
        if (!saved) return current

        const quests = mergeQuestStates(
          saved.quests ?? current.quests,
          QUEST_DEFINITIONS,
        )

        const today = getTodayDateString()
        const streak = resolveStreakState(
          quests,
          QUEST_DEFINITIONS,
          {
            currentStreak: saved.currentStreak ?? current.currentStreak,
            lastDailyCoreCompleteDate:
              saved.lastDailyCoreCompleteDate ??
              current.lastDailyCoreCompleteDate,
          },
          today,
        )

        return {
          ...current,
          ...saved,
          hero: saved.hero ?? current.hero,
          quests,
          completionRewardClaims:
            saved.completionRewardClaims ?? createInitialCompletionClaims(),
          currentStreak: streak.currentStreak,
          lastDailyCoreCompleteDate: streak.lastDailyCoreCompleteDate,
        }
      },
      onRehydrateStorage: () => (state) => {
        state?.applyPeriodResets()
        state?.reconcileStreak()
      },
    },
  ),
)
