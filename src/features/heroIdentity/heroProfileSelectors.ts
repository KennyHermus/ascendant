import { LIFETIME_ACCOMPLISHMENT_DEFINITIONS } from '@/data/lifetimeAccomplishments'
import { HERO_IDENTITY_TITLE_DEFINITIONS } from '@/data/heroIdentityTitles'
import { completionRate } from '@/features/analytics/analyticsHelpers'
import { getQuestAnalytics } from '@/features/analytics/analyticsLogic'
import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import { isDateInRange, resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import { generateHeroBiographyLines } from '@/features/heroIdentity/heroBiographyLogic'
import {
  buildHeroIdentityMetrics,
  getNextAccomplishmentTargets,
  resolveActiveHeroTitle,
  type HeroIdentityEvaluationInput,
} from '@/features/heroIdentity/heroIdentityLogic'
import { getHeroInitials } from '@/features/hero/heroPresentation'
import { getHeroTitle } from '@/features/hero/heroTitle'
import { getXpProgress } from '@/features/progression/progressionLogic'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { HeroIdentityState, HeroProfileViewModel } from '@/types/heroIdentity'

const PROFILE_ANALYTICS_PERIOD: AnalyticsPeriod = 'last365'
const WORKOUT_QUEST_ID = 'workout'

export interface HeroProfileInput extends HeroIdentityEvaluationInput {
  analytics: AnalyticsInput
  heroIdentity: HeroIdentityState
}

function getWorkoutQuestCompletionRate(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): number | null {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  let completed = 0
  let missed = 0

  for (const record of input.questHistory.completions) {
    if (record.questId !== WORKOUT_QUEST_ID) continue
    if (!isDateInRange(record.heroDayKey, range)) continue
    completed += 1
  }

  for (const record of input.questHistory.misses) {
    if (record.questId !== WORKOUT_QUEST_ID) continue
    if (!isDateInRange(record.heroDayKey, range)) continue
    missed += 1
  }

  return completionRate(completed, missed)
}

export function selectHeroProfile(input: HeroProfileInput): HeroProfileViewModel {
  const metrics = buildHeroIdentityMetrics(input)
  const xp = getXpProgress(input.hero)
  const activeTitle = resolveActiveHeroTitle(input.heroIdentity)
  const questAnalytics = getQuestAnalytics(input.analytics, PROFILE_ANALYTICS_PERIOD)

  const unlockedAccomplishmentIds = new Set(input.heroIdentity.unlockedAccomplishmentIds)
  const unlockedTitleIds = new Set(input.heroIdentity.unlockedTitleIds)

  return {
    name: input.hero.name,
    initials: getHeroInitials(input.hero.name),
    heroTitle: activeTitle?.name ?? null,
    currentRank: getHeroTitle(input.hero.level),
    level: input.hero.level,
    currentXp: xp.current,
    xpRequired: xp.required,
    xpPercent: xp.percent,
    lifetimeGold: input.hero.lifetimeStats.totalGoldEarned,
    daysActive: metrics.daysActive,
    currentStreak: input.currentStreak,
    longestStreak: metrics.longestStreak,
    overallCompletionPercent: questAnalytics.completionRate,
    overallTrainingPercent: getWorkoutQuestCompletionRate(
      input.analytics,
      PROFILE_ANALYTICS_PERIOD,
    ),
    overallNutritionPercent: questAnalytics.bySubcategory.nutrition.rate,
    biographyLines: generateHeroBiographyLines(
      metrics,
      input.heroIdentity.unlockedAccomplishmentIds,
    ),
    unlockedAccomplishments: LIFETIME_ACCOMPLISHMENT_DEFINITIONS.filter((definition) =>
      unlockedAccomplishmentIds.has(definition.id),
    ).sort((a, b) => a.sortOrder - b.sortOrder),
    unlockedTitles: HERO_IDENTITY_TITLE_DEFINITIONS.filter((title) =>
      unlockedTitleIds.has(title.id),
    ).sort((a, b) => b.priority - a.priority),
    nextAccomplishments: getNextAccomplishmentTargets(input.heroIdentity, metrics),
  }
}
