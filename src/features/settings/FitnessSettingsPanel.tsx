import { useState } from 'react'

import { Accordion } from '@/components/Accordion'
import { Panel } from '@/components/Panel'
import {
  DISTANCE_UNITS,
  DURATION_DISPLAY_UNITS,
  WEIGHT_UNITS,
} from '@/types/fitnessSettings'
import { useGameStore } from '@/store/gameStore'

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min?: number
  step?: number
  placeholder?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone-400">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-2.5 py-1.5 text-stone-200"
      />
    </label>
  )
}

function UnitSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-2.5 py-1.5 text-stone-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function FitnessSettingsForm() {
  const settings = useGameStore((s) => s.fitnessSettings)
  const updateFitnessSettings = useGameStore((s) => s.updateFitnessSettings)

  const [protein, setProtein] = useState(String(settings.proteinGrams))
  const [calories, setCalories] = useState(String(settings.calories))
  const [water, setWater] = useState(
    settings.waterMl == null ? '' : String(settings.waterMl),
  )

  function saveTargets() {
    const proteinGrams = Number(protein)
    const calorieTarget = Number(calories)
    const waterMl = water.trim() === '' ? null : Number(water)
    if (!Number.isFinite(proteinGrams) || proteinGrams <= 0) return
    if (!Number.isFinite(calorieTarget) || calorieTarget <= 0) return
    if (waterMl != null && (!Number.isFinite(waterMl) || waterMl < 0)) return

    updateFitnessSettings({
      proteinGrams,
      calories: calorieTarget,
      waterMl,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Daily protein (g)" value={protein} onChange={setProtein} />
        <NumberField label="Daily calories" value={calories} onChange={setCalories} />
        <NumberField
          label="Daily water (ml)"
          value={water}
          onChange={setWater}
          placeholder="Coming soon"
        />
      </div>
      <button
        type="button"
        onClick={saveTargets}
        className="rounded-md border border-sky-700/50 bg-sky-950/40 px-3 py-1.5 text-xs text-sky-200 transition hover:bg-sky-900/50"
      >
        Save Targets
      </button>

      <div className="border-t border-stone-800/60 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-500">
          Preferred Units
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <UnitSelect
            label="Weight"
            value={settings.units.weight}
            options={WEIGHT_UNITS}
            onChange={(weight) => updateFitnessSettings({ units: { weight } })}
          />
          <UnitSelect
            label="Distance"
            value={settings.units.distance}
            options={DISTANCE_UNITS}
            onChange={(distance) => updateFitnessSettings({ units: { distance } })}
          />
          <UnitSelect
            label="Duration"
            value={settings.units.duration}
            options={DURATION_DISPLAY_UNITS}
            onChange={(duration) => updateFitnessSettings({ units: { duration } })}
          />
        </div>
      </div>

      <Accordion title="Workout Preferences" persistKey="fitness-settings:workout-prefs">
        <p className="text-xs text-stone-500">
          Default workout preferences will appear here in a future update.
        </p>
      </Accordion>
    </div>
  )
}

/** Player-configurable fitness targets and unit preferences (v0.0.4). */
export function FitnessSettingsPanel() {
  return (
    <Panel title="Fitness Settings">
      <FitnessSettingsForm />
    </Panel>
  )
}
