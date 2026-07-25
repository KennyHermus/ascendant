import type { FitnessSettings } from '@/types/fitnessSettings'
import { FITNESS_SETTINGS_SCHEMA_VERSION } from '@/types/fitnessSettings'

export const DEFAULT_FITNESS_SETTINGS: FitnessSettings = {
  schemaVersion: FITNESS_SETTINGS_SCHEMA_VERSION,
  proteinGrams: 150,
  calories: 2200,
  waterMl: null,
  units: {
    weight: 'lb',
    distance: 'mi',
    duration: 'minutes',
  },
  workoutPreferences: {},
}
