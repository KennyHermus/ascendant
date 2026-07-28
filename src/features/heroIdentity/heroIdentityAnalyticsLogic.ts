import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import {
  buildHeroIdentityMetrics,
  resolveActiveHeroTitle,
} from '@/features/heroIdentity/heroIdentityLogic'
import { getHeroTitle } from '@/features/hero/heroTitle'
import type { HeroIdentityAnalytics } from '@/types/analytics'
import type { HeroIdentityState } from '@/types/heroIdentity'

export interface HeroIdentityAnalyticsInput extends AnalyticsInput {
  heroIdentity: HeroIdentityState
}

export function getHeroIdentityAnalytics(
  input: HeroIdentityAnalyticsInput,
): HeroIdentityAnalytics {
  const metrics = buildHeroIdentityMetrics({
    hero: input.hero,
    currentStreak: input.currentStreak,
    history: input.history,
    workoutActivities: input.workoutActivities,
    performance: input.performance,
    questDefinitions: input.questDefinitions,
    now: input.now,
  })
  const activeTitle = resolveActiveHeroTitle(input.heroIdentity)

  return {
    daysActive: metrics.daysActive,
    accomplishmentsUnlocked: input.heroIdentity.unlockedAccomplishmentIds.length,
    titlesUnlocked: input.heroIdentity.unlockedTitleIds.length,
    activeTitle: activeTitle?.name ?? null,
    currentRank: getHeroTitle(input.hero.level),
  }
}
