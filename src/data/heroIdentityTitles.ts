import type { HeroIdentityTitleDefinition } from '@/types/heroIdentity'

/**
 * Unlockable Hero Titles — earned through lifetime accomplishments.
 * Only one may be active; v0.0.5 auto-selects the highest `priority`.
 */
export const HERO_IDENTITY_TITLE_DEFINITIONS: HeroIdentityTitleDefinition[] = [
  {
    id: 'the-persistent',
    name: 'The Persistent',
    description: 'Earned by completing 100 quests.',
    requiredAccomplishmentId: 'quests-100',
    priority: 10,
  },
  {
    id: 'the-disciplined',
    name: 'The Disciplined',
    description: 'Earned by completing 500 quests.',
    requiredAccomplishmentId: 'quests-500',
    priority: 30,
  },
  {
    id: 'the-athlete',
    name: 'The Athlete',
    description: 'Earned by logging 100 workouts.',
    requiredAccomplishmentId: 'workouts-100',
    priority: 40,
  },
  {
    id: 'the-consistent',
    name: 'The Consistent',
    description: 'Earned by staying active for 100 days.',
    requiredAccomplishmentId: 'days-100',
    priority: 50,
  },
  {
    id: 'the-unbreakable',
    name: 'The Unbreakable',
    description: 'Earned by reaching a 63-day streak.',
    requiredAccomplishmentId: 'streak-63',
    priority: 60,
  },
  {
    id: 'the-scholar',
    name: 'The Scholar',
    description: 'Earned by completing 100 learning quests.',
    requiredAccomplishmentId: 'learning-100',
    priority: 20,
  },
]

export const HERO_IDENTITY_TITLE_BY_ID = new Map(
  HERO_IDENTITY_TITLE_DEFINITIONS.map((definition) => [definition.id, definition]),
)
