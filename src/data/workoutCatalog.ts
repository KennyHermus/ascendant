import { DEFAULT_WORKOUT_TEMPLATES } from '@/data/workoutTemplates'
import { DURATION_ACTIVITY_DEFINITIONS } from '@/data/durationActivities'
import type { WorkoutActivityStructure } from '@/types/workout'

export const WORKOUT_CATEGORIES = ['strength', 'cardio', 'sports'] as const

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number]

export const WORKOUT_CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  sports: 'Sports',
}

export interface WorkoutCatalogEntry {
  id: string
  name: string
  category: WorkoutCategory
  activityStructure: WorkoutActivityStructure
  estimatedDurationMinutes?: number
  /** When false, shown as a future placeholder — not startable. */
  implemented: boolean
  description?: string
}

const STRENGTH_ENTRIES: WorkoutCatalogEntry[] = DEFAULT_WORKOUT_TEMPLATES.map((template) => ({
  id: template.id,
  name: template.name,
  category: 'strength' as const,
  activityStructure: 'exercise' as const,
  estimatedDurationMinutes: template.estimatedDurationMinutes,
  implemented: true,
  description: template.description,
}))

const CARDIO_ENTRIES: WorkoutCatalogEntry[] = [
  {
    id: DURATION_ACTIVITY_DEFINITIONS.walk.id,
    name: DURATION_ACTIVITY_DEFINITIONS.walk.name,
    category: 'cardio',
    activityStructure: 'duration',
    implemented: true,
    description: DURATION_ACTIVITY_DEFINITIONS.walk.description,
  },
  {
    id: DURATION_ACTIVITY_DEFINITIONS.run.id,
    name: DURATION_ACTIVITY_DEFINITIONS.run.name,
    category: 'cardio',
    activityStructure: 'duration',
    implemented: false,
    description: DURATION_ACTIVITY_DEFINITIONS.run.description,
  },
  {
    id: DURATION_ACTIVITY_DEFINITIONS.cycle.id,
    name: DURATION_ACTIVITY_DEFINITIONS.cycle.name,
    category: 'cardio',
    activityStructure: 'duration',
    implemented: false,
    description: DURATION_ACTIVITY_DEFINITIONS.cycle.description,
  },
  {
    id: DURATION_ACTIVITY_DEFINITIONS.swim.id,
    name: DURATION_ACTIVITY_DEFINITIONS.swim.name,
    category: 'cardio',
    activityStructure: 'duration',
    implemented: false,
    description: DURATION_ACTIVITY_DEFINITIONS.swim.description,
  },
  {
    id: DURATION_ACTIVITY_DEFINITIONS.hike.id,
    name: DURATION_ACTIVITY_DEFINITIONS.hike.name,
    category: 'cardio',
    activityStructure: 'duration',
    implemented: false,
    description: DURATION_ACTIVITY_DEFINITIONS.hike.description,
  },
]

const SPORTS_ENTRIES: WorkoutCatalogEntry[] = [
  {
    id: 'basketball',
    name: 'Basketball',
    category: 'sports',
    activityStructure: 'duration',
    implemented: false,
    description: 'Future sports activity placeholder.',
  },
  {
    id: 'soccer',
    name: 'Soccer',
    category: 'sports',
    activityStructure: 'duration',
    implemented: false,
    description: 'Future sports activity placeholder.',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    category: 'sports',
    activityStructure: 'duration',
    implemented: false,
    description: 'Future sports activity placeholder.',
  },
]

export const WORKOUT_CATALOG: WorkoutCatalogEntry[] = [
  ...STRENGTH_ENTRIES,
  ...CARDIO_ENTRIES,
  ...SPORTS_ENTRIES,
]

export function getWorkoutCatalogEntry(id: string): WorkoutCatalogEntry | undefined {
  return WORKOUT_CATALOG.find((entry) => entry.id === id)
}

export function getDefaultImplementedCatalogId(): string {
  return WORKOUT_CATALOG.find((entry) => entry.implemented)?.id ?? 'upper-body'
}

export function getWorkoutCatalogByCategory(): Array<{
  category: WorkoutCategory
  label: string
  entries: WorkoutCatalogEntry[]
}> {
  return WORKOUT_CATEGORIES.map((category) => ({
    category,
    label: WORKOUT_CATEGORY_LABELS[category],
    entries: WORKOUT_CATALOG.filter((entry) => entry.category === category),
  }))
}

export function formatCatalogDuration(entry: WorkoutCatalogEntry): string | null {
  if (entry.estimatedDurationMinutes == null) return null
  return `~${entry.estimatedDurationMinutes} min`
}
