import type { LifetimeAccomplishmentDefinition } from '@/types/heroIdentity'

/**
 * Lifetime milestones — the Hero's legacy. Distinct from collectible
 * Achievements; these define identity, titles, biography, and timeline moments.
 */
export const LIFETIME_ACCOMPLISHMENT_DEFINITIONS: LifetimeAccomplishmentDefinition[] = [
  {
    id: 'quests-100',
    name: '100 Quests',
    description: 'Complete 100 quests across your journey.',
    timelineLabel: 'Hero completed 100 quests.',
    condition: { kind: 'total_quests', min: 100 },
    sortOrder: 10,
  },
  {
    id: 'quests-500',
    name: '500 Quests',
    description: 'Complete 500 quests — a mark of sustained discipline.',
    timelineLabel: 'Hero completed 500 quests.',
    condition: { kind: 'total_quests', min: 500 },
    sortOrder: 20,
  },
  {
    id: 'workouts-100',
    name: '100 Workouts',
    description: 'Log 100 completed training sessions.',
    timelineLabel: 'Hero completed 100 workouts.',
    condition: { kind: 'workouts_completed', min: 100 },
    sortOrder: 30,
  },
  {
    id: 'pushups-1000',
    name: '1,000 Push-ups',
    description: 'Accumulate 1,000 completed push-up reps in training.',
    timelineLabel: 'Hero logged 1,000 push-up reps.',
    condition: { kind: 'push_up_reps', min: 1000 },
    sortOrder: 40,
  },
  {
    id: 'days-100',
    name: '100 Days Active',
    description: 'Show up on 100 distinct Hero Days.',
    timelineLabel: 'Hero remained active for 100 days.',
    condition: { kind: 'days_active', min: 100 },
    sortOrder: 50,
  },
  {
    id: 'streak-63',
    name: '63-Day Streak',
    description: 'Maintain a 63-day non-negotiable streak.',
    timelineLabel: 'Hero remained consistent for 63 consecutive days.',
    condition: { kind: 'longest_streak', min: 63 },
    sortOrder: 60,
  },
  {
    id: 'level-10',
    name: 'Level 10',
    description: 'Reach Hero Level 10.',
    timelineLabel: 'Hero reached Level 10.',
    condition: { kind: 'level', min: 10 },
    sortOrder: 70,
    emitTimelineEvent: false,
  },
  {
    id: 'level-25',
    name: 'Level 25',
    description: 'Reach Hero Level 25.',
    timelineLabel: 'Hero reached Level 25.',
    condition: { kind: 'level', min: 25 },
    sortOrder: 80,
    emitTimelineEvent: false,
  },
  {
    id: 'prs-100',
    name: '100 Personal Records',
    description: 'Set 100 official personal records through assessments.',
    timelineLabel: 'Hero achieved 100 Personal Records.',
    condition: { kind: 'personal_records', min: 100 },
    sortOrder: 90,
  },
  {
    id: 'learning-100',
    name: '100 Learning Quests',
    description: 'Complete Bible and reading quests 100 times combined.',
    timelineLabel: 'Hero completed 100 learning quests.',
    condition: { kind: 'learning_quest_completions', min: 100 },
    sortOrder: 100,
  },
]

export const LIFETIME_ACCOMPLISHMENT_BY_ID = new Map(
  LIFETIME_ACCOMPLISHMENT_DEFINITIONS.map((definition) => [definition.id, definition]),
)
