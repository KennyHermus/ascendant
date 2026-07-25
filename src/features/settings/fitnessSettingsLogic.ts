import { DEFAULT_FITNESS_SETTINGS } from '@/data/defaultFitnessSettings'
import type { NutritionTargets } from '@/types/nutrition'
import {
  FITNESS_SETTINGS_SCHEMA_VERSION,
  type FitnessSettings,
  type FitnessSettingsPatch,
} from '@/types/fitnessSettings'

export function createDefaultFitnessSettings(): FitnessSettings {
  return {
    ...DEFAULT_FITNESS_SETTINGS,
    units: { ...DEFAULT_FITNESS_SETTINGS.units },
    workoutPreferences: { ...DEFAULT_FITNESS_SETTINGS.workoutPreferences },
  }
}

export function mergeFitnessSettings(
  saved: Partial<FitnessSettings> | undefined,
): FitnessSettings {
  const defaults = createDefaultFitnessSettings()
  if (!saved) return defaults

  return {
    ...defaults,
    ...saved,
    schemaVersion: FITNESS_SETTINGS_SCHEMA_VERSION,
    units: { ...defaults.units, ...saved.units },
    workoutPreferences: {
      ...defaults.workoutPreferences,
      ...saved.workoutPreferences,
    },
  }
}

export function fitnessSettingsToNutritionTargets(
  settings: FitnessSettings,
): NutritionTargets {
  return {
    proteinGrams: settings.proteinGrams,
    calories: settings.calories,
    waterMl: settings.waterMl,
  }
}

export function applyFitnessSettingsPatch(
  current: FitnessSettings,
  patch: FitnessSettingsPatch,
): FitnessSettings {
  return {
    ...current,
    ...patch,
    units: { ...current.units, ...patch.units },
    workoutPreferences: {
      ...current.workoutPreferences,
      ...patch.workoutPreferences,
    },
  }
}

/** Seed fitness settings from an existing nutrition block (migration / backfill). */
export function fitnessSettingsFromNutritionTargets(
  targets: NutritionTargets,
): FitnessSettings {
  const base = createDefaultFitnessSettings()
  return {
    ...base,
    proteinGrams: targets.proteinGrams,
    calories: targets.calories,
    waterMl: targets.waterMl,
  }
}
