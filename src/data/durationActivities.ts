/**
 * Duration-based workout activities — measured primarily by elapsed time,
 * not sets/reps. Walk is the first implemented type; others are reserved for
 * future UI (Run, Bike, Swim, Hike).
 */

export const DURATION_ACTIVITY_TYPES = ['walk', 'run', 'cycle', 'swim', 'hike'] as const

export type DurationActivityType = (typeof DURATION_ACTIVITY_TYPES)[number]

export interface DurationActivityDefinition {
  id: DurationActivityType
  name: string
  description: string
}

export const DURATION_ACTIVITY_DEFINITIONS: Record<
  DurationActivityType,
  DurationActivityDefinition
> = {
  walk: {
    id: 'walk',
    name: 'Walk',
    description: 'Track a walking session by duration.',
  },
  run: {
    id: 'run',
    name: 'Run',
    description: 'Track a running session by duration.',
  },
  cycle: {
    id: 'cycle',
    name: 'Cycle',
    description: 'Track a cycling session by duration.',
  },
  swim: {
    id: 'swim',
    name: 'Swim',
    description: 'Track a swimming session by duration.',
  },
  hike: {
    id: 'hike',
    name: 'Hike',
    description: 'Track a hiking session by duration.',
  },
}

/** @deprecated Use `getWorkoutCatalogByCategory()` — catalog is the single picker source. */
export const AVAILABLE_DURATION_ACTIVITIES: DurationActivityDefinition[] = [
  DURATION_ACTIVITY_DEFINITIONS.walk,
]

export function getDurationActivityDefinition(
  activityType: string,
): DurationActivityDefinition | undefined {
  return DURATION_ACTIVITY_DEFINITIONS[activityType as DurationActivityType]
}

export function isDurationActivityType(value: string): value is DurationActivityType {
  return (DURATION_ACTIVITY_TYPES as readonly string[]).includes(value)
}
