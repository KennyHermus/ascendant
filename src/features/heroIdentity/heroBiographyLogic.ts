import { LIFETIME_ACCOMPLISHMENT_DEFINITIONS } from '@/data/lifetimeAccomplishments'
import type { HeroIdentityMetrics } from '@/types/heroIdentity'

function formatCount(value: number): string {
  return value.toLocaleString()
}

/**
 * Generates a living Hero biography from lifetime metrics and earned milestones.
 * Purely derived — no persisted text — so it always reflects current progress.
 */
export function generateHeroBiographyLines(
  metrics: HeroIdentityMetrics,
  unlockedAccomplishmentIds: readonly string[] = [],
): string[] {
  const lines: string[] = []
  const unlocked = new Set(unlockedAccomplishmentIds)

  if (metrics.level > 1) {
    lines.push(`Reached Level ${metrics.level}.`)
  }

  if (metrics.totalQuestsCompleted > 0) {
    lines.push(`Completed ${formatCount(metrics.totalQuestsCompleted)} quests across the journey.`)
  }

  if (metrics.currentStreak >= 2) {
    lines.push(`Maintained a ${metrics.currentStreak}-day streak.`)
  } else if (metrics.longestStreak >= 2) {
    lines.push(`Longest streak: ${metrics.longestStreak} consecutive days.`)
  }

  if (metrics.workoutsCompleted > 0) {
    lines.push(`Completed ${formatCount(metrics.workoutsCompleted)} workouts.`)
  }

  if (metrics.personalRecords > 0) {
    const label = metrics.personalRecords === 1 ? 'Personal Record' : 'Personal Records'
    lines.push(`Achieved ${formatCount(metrics.personalRecords)} ${label}.`)
  }

  if (metrics.learningQuestCompletions >= 5) {
    lines.push(
      `Dedicated ${formatCount(metrics.learningQuestCompletions)} sessions to learning.`,
    )
  }

  if (metrics.daysActive >= 7) {
    lines.push(`Active on ${formatCount(metrics.daysActive)} Hero Days.`)
  }

  if (metrics.pushUpReps >= 500) {
    lines.push(`Logged ${formatCount(metrics.pushUpReps)} push-up reps in training.`)
  }

  // Weave in recent milestone headlines without repeating level/quest stats.
  const milestoneLines = LIFETIME_ACCOMPLISHMENT_DEFINITIONS.filter(
    (definition) =>
      unlocked.has(definition.id) &&
      definition.condition.kind !== 'level' &&
      definition.condition.kind !== 'total_quests' &&
      definition.condition.kind !== 'longest_streak',
  )
    .sort((a, b) => b.sortOrder - a.sortOrder)
    .slice(0, 2)
    .map((definition) => definition.timelineLabel)

  for (const line of milestoneLines) {
    if (!lines.includes(line)) lines.push(line)
  }

  if (lines.length === 0) {
    return ['The journey has just begun — every quest completed shapes the legend ahead.']
  }

  return lines.slice(0, 7)
}
