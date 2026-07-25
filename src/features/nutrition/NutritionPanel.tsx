import { useState } from 'react'

import { Accordion } from '@/components/Accordion'
import { Panel } from '@/components/Panel'
import { AnalyticsPeriodFilter } from '@/features/analytics/AnalyticsPeriodFilter'
import { TimeSeriesLineChart } from '@/features/analytics/components/TimeSeriesLineChart'
import { createFoodEntry } from '@/features/nutrition/nutritionLogic'
import {
  formatCalories,
  formatGrams,
  formatMealTime,
  formatTargetPercent,
  MEAL_TYPE_ICONS,
  MEAL_TYPE_LABELS,
} from '@/features/nutrition/nutritionPresentation'
import type { NutritionTargetProgress } from '@/features/nutrition/nutritionDashboardLogic'
import {
  useNutritionChartBundle,
  useTodayNutritionSummary,
} from '@/features/nutrition/nutritionSelectors'
import { useGameStore } from '@/store/gameStore'
import { MEAL_TYPES } from '@/types/nutrition'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { FoodEntry, MealType } from '@/types/nutrition'

function TargetProgressBlock({
  label,
  progress,
  unit,
}: {
  label: string
  progress: NutritionTargetProgress
  unit: 'grams' | 'calories'
}) {
  const format = unit === 'grams' ? formatGrams : formatCalories
  const percent = progress.percent !== null ? Math.min(100, progress.percent * 100) : 0

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-stone-400">{label}</span>
        <span className="text-stone-300">
          {format(progress.consumed)} / {format(progress.target)}
          {progress.percent !== null && (
            <span className="ml-1 text-stone-500">
              ({formatTargetPercent(progress.percent)})
            </span>
          )}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full border border-stone-700/50 bg-stone-950">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function FoodEntryRow({
  entry,
  onChange,
  onRemove,
  removable,
}: {
  entry: FoodEntry
  onChange: (patch: Partial<FoodEntry>) => void
  onRemove: () => void
  removable: boolean
}) {
  function numberOrUndefined(value: string): number | undefined {
    if (value.trim() === '') return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return (
    <div className="space-y-2 rounded-md border border-stone-700/40 bg-stone-950/40 p-2.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Food name (optional)"
          value={entry.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          className="min-w-0 flex-1 rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-xs text-stone-200"
        />
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove food entry"
            className="shrink-0 rounded border border-stone-700/50 px-2 py-1 text-xs text-stone-500 hover:text-red-300"
          >
            ✕
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <label className="text-[10px] text-stone-500">
          Protein
          <input
            type="number"
            inputMode="decimal"
            placeholder="g"
            value={entry.proteinGrams ?? ''}
            onChange={(e) => onChange({ proteinGrams: numberOrUndefined(e.target.value) })}
            className="mt-0.5 w-full rounded border border-stone-700/50 bg-stone-950/60 px-1.5 py-1 text-xs text-stone-200"
          />
        </label>
        <label className="text-[10px] text-stone-500">
          Carbs
          <input
            type="number"
            inputMode="decimal"
            placeholder="g"
            value={entry.carbsGrams ?? ''}
            onChange={(e) => onChange({ carbsGrams: numberOrUndefined(e.target.value) })}
            className="mt-0.5 w-full rounded border border-stone-700/50 bg-stone-950/60 px-1.5 py-1 text-xs text-stone-200"
          />
        </label>
        <label className="text-[10px] text-stone-500">
          Fat
          <input
            type="number"
            inputMode="decimal"
            placeholder="g"
            value={entry.fatGrams ?? ''}
            onChange={(e) => onChange({ fatGrams: numberOrUndefined(e.target.value) })}
            className="mt-0.5 w-full rounded border border-stone-700/50 bg-stone-950/60 px-1.5 py-1 text-xs text-stone-200"
          />
        </label>
        <label className="text-[10px] text-stone-500">
          Calories
          <input
            type="number"
            inputMode="decimal"
            placeholder="kcal"
            value={entry.calories ?? ''}
            onChange={(e) => onChange({ calories: numberOrUndefined(e.target.value) })}
            className="mt-0.5 w-full rounded border border-stone-700/50 bg-stone-950/60 px-1.5 py-1 text-xs text-stone-200"
          />
        </label>
      </div>
    </div>
  )
}

function MealLogForm() {
  const logMeal = useGameStore((s) => s.logMeal)
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(() => [createFoodEntry()])
  const [notes, setNotes] = useState('')

  function updateEntry(id: string, patch: Partial<FoodEntry>) {
    setFoodEntries((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    )
  }

  function addEntry() {
    setFoodEntries((entries) => [...entries, createFoodEntry()])
  }

  function removeEntry(id: string) {
    setFoodEntries((entries) => entries.filter((entry) => entry.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const success = logMeal({
      mealType,
      foodEntries,
      notes: notes.trim() || undefined,
    })
    if (success) {
      setFoodEntries([createFoodEntry()])
      setNotes('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-xs text-stone-500">
        Meal
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          className="mt-1 w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-3 py-2 text-sm text-stone-200"
        >
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {MEAL_TYPE_ICONS[type]} {MEAL_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        {foodEntries.map((entry) => (
          <FoodEntryRow
            key={entry.id}
            entry={entry}
            onChange={(patch) => updateEntry(entry.id, patch)}
            onRemove={() => removeEntry(entry.id)}
            removable={foodEntries.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={addEntry}
          className="w-full rounded-md border border-dashed border-stone-700/50 py-1.5 text-xs text-stone-500 hover:border-stone-600 hover:text-stone-300"
        >
          + Add another food
        </button>
      </div>

      <label className="block text-xs text-stone-500">
        Notes (optional)
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-3 py-2 text-sm text-stone-200"
        />
      </label>

      <button
        type="submit"
        className="rounded-md border border-amber-700/50 bg-amber-900/40 px-3 py-1.5 text-sm font-medium text-amber-100 transition hover:bg-amber-800/50"
      >
        Log {MEAL_TYPE_LABELS[mealType]}
      </button>
    </form>
  )
}

function NutritionCharts() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('last7')
  const bundle = useNutritionChartBundle(period)

  return (
    <div className="space-y-3">
      <AnalyticsPeriodFilter value={period} onChange={setPeriod} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TimeSeriesLineChart title="Protein Trend" series={bundle.proteinTrend} color="sky" />
        <TimeSeriesLineChart title="Calorie Trend" series={bundle.calorieTrend} color="amber" />
      </div>
    </div>
  )
}

/**
 * Nutrition dashboard — quick meal logging, the Daily Nutrition Summary, a
 * configurable targets editor, and protein/calorie trend charts. Deliberately
 * lighter-weight than `WorkoutAnalyticsPanel` — nutrition insights live in
 * `InsightsDashboard` (see `insightsNutrition.ts`) rather than a bespoke
 * Analytics Domain panel, per docs/NUTRITION.md.
 */
export function NutritionPanel() {
  const summary = useTodayNutritionSummary()
  const deleteMealActivity = useGameStore((s) => s.deleteMealActivity)

  return (
    <Panel title="Nutrition">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {MEAL_TYPES.map((type) => {
              const logged = summary.mealsLogged.includes(type)
              return (
                <span
                  key={type}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    logged
                      ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-200'
                      : 'border-stone-700/40 bg-stone-950/40 text-stone-500'
                  }`}
                >
                  {MEAL_TYPE_ICONS[type]} {MEAL_TYPE_LABELS[type]}
                </span>
              )
            })}
          </div>

          <TargetProgressBlock
            label="Protein"
            progress={summary.targetCompletion.protein}
            unit="grams"
          />
          <TargetProgressBlock
            label="Calories"
            progress={summary.targetCompletion.calories}
            unit="calories"
          />

          {summary.missingRequiredMealTypes.length > 0 && (
            <p className="text-xs text-amber-400/80">
              Not yet logged today:{' '}
              {summary.missingRequiredMealTypes
                .map((type) => MEAL_TYPE_LABELS[type])
                .join(', ')}
            </p>
          )}

          {summary.mealTiming.length > 0 && (
            <ul className="space-y-1">
              {summary.mealTiming.map((entry) => (
                <li
                  key={entry.activityId}
                  className="flex items-center justify-between gap-2 rounded-md border border-stone-700/40 bg-stone-950/30 px-2.5 py-1.5 text-xs text-stone-300"
                >
                  <span>
                    {MEAL_TYPE_ICONS[entry.mealType]} {MEAL_TYPE_LABELS[entry.mealType]}
                    <span className="ml-1.5 text-stone-500">
                      {formatMealTime(entry.completedAt)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMealActivity(entry.activityId)}
                    aria-label="Delete meal"
                    className="shrink-0 text-stone-600 hover:text-red-300"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Accordion title="Log a Meal" defaultExpanded persistKey="nutrition-log-meal">
          <MealLogForm />
        </Accordion>

        <Accordion title="Nutrition Trends" persistKey="nutrition-trends">
          <NutritionCharts />
        </Accordion>
      </div>
    </Panel>
  )
}
