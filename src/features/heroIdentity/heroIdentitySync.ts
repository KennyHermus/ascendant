import { QUEST_DEFINITIONS } from '@/data/quests'
import { appendEvents } from '@/features/events/eventLogic'
import {
  recordHeroTitleEarned,
  recordLifetimeAccomplishmentEarned,
} from '@/features/events/eventLogic'
import { evaluateHeroIdentity } from '@/features/heroIdentity/heroIdentityLogic'
import { getCurrentGameTime } from '@/lib/gameTime'
import type { GameEvent } from '@/types/event'
import type { HeroIdentityState } from '@/types/heroIdentity'
import type { Hero } from '@/types/hero'
import type { HeroHistory } from '@/types/history'
import type { PerformanceState } from '@/types/performance'
import type { WorkoutActivity } from '@/types/workout'

export interface HeroIdentitySyncInput {
  heroIdentity: HeroIdentityState
  hero: Hero
  currentStreak: number
  history: HeroHistory
  workoutActivities: WorkoutActivity[]
  performance: PerformanceState
  events: GameEvent[]
  now?: Date
}

export interface HeroIdentitySyncResult {
  heroIdentity: HeroIdentityState
  events: GameEvent[]
  changed: boolean
}

export function syncHeroIdentityState(input: HeroIdentitySyncInput): HeroIdentitySyncResult {
  const now = input.now ?? getCurrentGameTime()
  const evaluation = evaluateHeroIdentity(input.heroIdentity, {
    hero: input.hero,
    currentStreak: input.currentStreak,
    history: input.history,
    workoutActivities: input.workoutActivities,
    performance: input.performance,
    questDefinitions: QUEST_DEFINITIONS,
    now,
  })

  if (
    evaluation.newlyUnlockedAccomplishments.length === 0 &&
    evaluation.newlyUnlockedTitles.length === 0
  ) {
    return {
      heroIdentity: input.heroIdentity,
      events: input.events,
      changed: false,
    }
  }

  const newEvents: GameEvent[] = [
    ...evaluation.newlyUnlockedAccomplishments
      .filter((accomplishment) => accomplishment.emitTimelineEvent !== false)
      .map((accomplishment) => recordLifetimeAccomplishmentEarned(accomplishment, now)),
    ...evaluation.newlyUnlockedTitles.map((title) => recordHeroTitleEarned(title, now)),
  ]

  return {
    heroIdentity: evaluation.identity,
    events: appendEvents(input.events, newEvents),
    changed: true,
  }
}
