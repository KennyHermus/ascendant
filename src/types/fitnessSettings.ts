export const FITNESS_SETTINGS_SCHEMA_VERSION = 1

export const WEIGHT_UNITS = ['lb', 'kg'] as const
export const DISTANCE_UNITS = ['mi', 'km'] as const
export const DURATION_DISPLAY_UNITS = ['minutes', 'hours'] as const

export type WeightUnit = (typeof WEIGHT_UNITS)[number]
export type DistanceUnit = (typeof DISTANCE_UNITS)[number]
export type DurationDisplayUnit = (typeof DURATION_DISPLAY_UNITS)[number]

export interface FitnessUnitPreferences {
  weight: WeightUnit
  distance: DistanceUnit
  duration: DurationDisplayUnit
}

/** Placeholder for future default workout preferences (template, rest timers, etc.). */
export interface WorkoutPreferences {
  /** Reserved — e.g. preferred default template id. */
  defaultTemplateId?: string | null
}

/**
 * Player-configurable fitness settings (v0.0.4).
 * Nutrition targets are mirrored into `NutritionState.targets` for analytics.
 */
export interface FitnessSettings {
  schemaVersion: number
  proteinGrams: number
  calories: number
  waterMl: number | null
  units: FitnessUnitPreferences
  workoutPreferences: WorkoutPreferences
}

export type FitnessSettingsPatch = Partial<
  Omit<FitnessSettings, 'schemaVersion' | 'units' | 'workoutPreferences'>
> & {
  units?: Partial<FitnessUnitPreferences>
  workoutPreferences?: Partial<WorkoutPreferences>
}
