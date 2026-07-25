# Nutrition System

Version: aligned with Ascendant v0.0.4

Covers **meal logging**, the **Nutrition dashboard**, **Hero Activity** integration, **Analytics**, and **Insights** for Nutrition.

See also: [ACTIVITIES.md](ACTIVITIES.md), [ANALYTICS.md](ANALYTICS.md), [INSIGHTS.md](INSIGHTS.md), [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md).

---

# Design Philosophy

Nutrition supports **Hero progression and future coaching** — it is not a calorie-tracking app.

- Focus on **habits and consistency**, not precision macro accounting.
- Logging a meal should take seconds — every food field is optional.
- The architecture leaves room for macros, micronutrients, meal plans, and external health-app sync **without** a data model rewrite.
- No stat bonuses yet — Nutrition only emits clean events; reward design is a later decision.

---

# Meals as Hero Activities

Meals are represented internally as **Hero Activities** — the same pattern as `WorkoutActivity` and `PerformanceAssessmentActivity` (see [ACTIVITIES.md](ACTIVITIES.md)).

```
MealActivity (gameplay record)
    ↓
Hero Time timestamp + food entries
    ↓
Events → Analytics → Insights
```

`'nutrition'` was added to `ACTIVITY_KINDS` (`src/types/activity.ts`). Unlike workouts, meal logging is an **instant, completed record** — there is no draft/session lifecycle. Meal logging **auto-completes** the corresponding nutrition quests through the same pipeline as workout-driven quest completion:

| Meal logged | Quest completed |
|-------------|-----------------|
| Breakfast | `breakfast` |
| Lunch | `lunch` |
| Dinner | `dinner` |
| Daily protein target met | `vitamins-protein` |

Resolution lives in `nutritionQuestResolution.ts` + `gameStore.logMeal()` → `completeQuest()`. Deleting a meal re-opens quests when criteria are no longer met (`nutritionQuestSync.ts`); XP/gold already granted are not clawed back.

```typescript
interface MealActivity extends ActivityBase {
  kind: 'nutrition'
  questId: string | null          // primary quest resolved on log
  mealType: MealType              // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodEntries: FoodEntry[]
  notes?: string
  integration?: NutritionIntegration
}
```

`ActivityBase` supplies `id`, `heroDayKey`, `startedAt`/`completedAt` (identical — meals are instant), and `completionGrade` (always `'completed'`).

---

# Meal Model

| Meal | Required? |
|------|-----------|
| Breakfast | Yes (`REQUIRED_MEAL_TYPES`) |
| Lunch | Yes |
| Dinner | Yes |
| Snack | No — never counts toward "missed meal" |

A Hero Day may have **any number** of meal activities, each timestamped with Hero Time (`getActiveHeroDayKey` — see [TIME.md](TIME.md)), consistent with multiple workouts per day.

---

# Food Entry Model

Every field is optional — quick logging never blocks on missing data:

```typescript
interface FoodEntry {
  id: string
  name?: string
  proteinGrams?: number
  carbsGrams?: number
  fatGrams?: number
  calories?: number
  notes?: string
}
```

Empty rows (no name, no macros, no notes) are dropped before persisting (`hasAnyFoodEntryData` in `nutritionLogic.ts`) — the form can always show a blank starter row without polluting saved data.

These same fields are what barcode scanning, photo logging, and external health-app sync would populate automatically — nothing about the shape is manual-entry-specific.

---

# Nutrition Targets

Configurable, never hardcoded:

```typescript
interface NutritionTargets {
  proteinGrams: number
  calories: number
  waterMl: number | null   // placeholder — no water logging yet
}
```

Defaults live in `src/data/nutritionTargets.ts` (`DEFAULT_NUTRITION_TARGETS`: 150g protein, 2200 kcal, water `null`) and are edited in-app via the Nutrition Targets form (`updateNutritionTargets()`), not recompiled into logic.

---

# Daily Nutrition Summary

`getDailyNutritionSummary(nutrition, heroDayKey)` (`nutritionDashboardLogic.ts`) → `DailyNutritionSummary`:

- `mealsLogged` — which meal types have an entry today
- `mealTiming` — each meal's type + completion time, oldest → newest
- `totals` — protein/carbs/fat/calories consumed
- `targetCompletion` — `{ protein, calories, water }`, each `{ consumed, target, percent }`
- `missingRequiredMealTypes` — required meals not yet logged (reads as "in progress" for the active day, "missed" for a past day)
- `isConsistentDay` — breakfast + lunch + dinner all logged

Rendered live on the Nutrition panel; also available for any past Hero Day via `useNutritionSummaryForDay(heroDayKey)`.

---

# Hero Integration (Events)

Nutrition emits two event types (`src/types/event.ts`), recorded by `src/features/events/eventLogic.ts`:

| Event | Fires when |
|-------|-----------|
| `NUTRITION_MEAL_LOGGED` | Every meal log — `activityId`, `mealType`, `heroDayKey`, `foodEntryCount`, `proteinGrams`, `calories` |
| `NUTRITION_TARGET_ACHIEVED` | The Hero Day's protein total crosses the target for the first time that day — `target: 'protein'`, `consumed`, `targetValue` |

Both integrate with the existing Timeline (`historyPresentation.ts` / `historyTimeline.ts`): `NUTRITION_MEAL_LOGGED` is a Quest-filter event, `NUTRITION_TARGET_ACHIEVED` is a Progress-filter event, and both group correctly by Hero Day in the daily timeline.

**No stat bonuses, no XP, no gold** are granted from these events yet — they exist purely as clean signal for future Hero progression and coaching to consume, per the current milestone's scope.

---

# Persistence

Nutrition persists independently on `GameState.nutrition`:

```typescript
interface NutritionState {
  schemaVersion: number
  targets: NutritionTargets
  activities: MealActivity[]   // unbounded per hero day, like workout.activities
}
```

- Save version **0.0.8** adds this block.
- Migration `0.0.7 → 0.0.8` defaults `nutrition` to empty state + `DEFAULT_NUTRITION_TARGETS` for saves that predate this feature — fully backward compatible, no existing data is touched.
- `mergeNutritionState()` (`nutritionLogic.ts`) is the single merge point used by both the migration and the store's persistence rehydration — same pattern as `workout`/`performance`.

---

# Analytics Integration

`NutritionAnalyticsInput` (`src/features/nutrition/nutritionAnalyticsInput.ts`) is a narrow, read-only input — `{ nutrition, questDefinitions, now }` — mirroring `WorkoutAnalyticsInput`. Any object shaped like the generic `AnalyticsInput` satisfies it structurally, so the core Insights/Analytics Engine keeps passing its full bundle through unchanged, while dedicated Nutrition selectors avoid depending on hero/quest/workout state they don't use.

`getNutritionAnalytics(input, period)` → `NutritionAnalytics` (defined once in `src/types/analytics.ts`, exposed on `PeriodAnalytics.nutrition`):

- `mealsLogged`, `daysTracked`
- `averageProteinPerDay`, `averageCaloriesPerDay`
- `proteinTargetAdherenceRate`, `calorieTargetAdherenceRate` — share of tracked days meeting target (calories within a ±10% band, since a calorie target can be a floor or ceiling)
- `mealConsistencyRate` — share of tracked days with all three required meals logged
- `currentMealLoggingStreak`, `currentProteinTargetStreak`, `currentMealConsistencyStreak` — consecutive Hero Days, walked backward from today (in-progress "today" doesn't break a streak — same rule as quest streaks)
- `missedMealCounts` — per meal type, over the period
- `averageMealTimeMinutes` — per meal type, minutes-after-midnight average (for "delayed dinner" style detection)

Charts: `buildNutritionChartBundle(input, period)` (`nutritionChartSelectors.ts`) builds a protein-trend and calorie-trend `ChartSeries`, rendered with the **existing** `TimeSeriesLineChart` — no new charting code.

No duplicate persistence — analytics reads `GameState.nutrition.activities` directly, same rule as Workout Analytics reading `GameState.workout.activities`.

---

# Insights

`generateNutritionInsights(input, period)` (`src/features/insights/insightsNutrition.ts`) interprets `getNutritionAnalytics()` output into informational-only cards, wired into the `quest` category of `generateInsightsForPeriod()` alongside quest and workout insights:

| Insight type | Example |
|--------------|---------|
| `nutritionProteinStreak` | "Your protein target has been achieved 5 days in a row." |
| `nutritionMealConsistency` | "Breakfast, lunch, and dinner are rarely all logged on the same day this period." |
| `nutritionMissedMeal` | "You consistently miss breakfast — logged on only 1 of 5 tracked days." |
| `nutritionMealTiming` | "Dinner is frequently delayed — averaging 8:24 PM." |

Thresholds (`insightsNutrition.ts`): a streak needs ≥3 days to be called out; missed-meal / low-consistency insights need ≥3 tracked days and a ≥50% rate; meal-timing insights fire when a meal's average time is past a fixed per-meal threshold (breakfast 9 AM, lunch 2 PM, dinner 8 PM). Insufficient evidence → no insight, never a guess.

Like all Insights, these are **interpretive only** — no coaching, no suggested actions. See [INSIGHTS.md](INSIGHTS.md).

---

# Module Map

```
src/types/nutrition.ts                    # MealType, FoodEntry, MealActivity, NutritionTargets, NutritionState
src/data/nutritionTargets.ts              # DEFAULT_NUTRITION_TARGETS
src/features/nutrition/
  nutritionLogic.ts                       # state create/merge, buildMealActivity, append/remove, targets
  nutritionStatistics.ts                  # nutrient totals + per-day grouping (used by dashboard/analytics/streaks)
  nutritionStreakLogic.ts                 # meal logging / consistency / protein target streaks
  nutritionDashboardLogic.ts              # DailyNutritionSummary
  nutritionAnalyticsInput.ts              # NutritionAnalyticsInput — narrow, read-only analytics input
  nutritionAnalyticsLogic.ts              # getNutritionAnalytics()
  nutritionChartSelectors.ts              # NutritionChartBundle (protein/calorie trend ChartSeries)
  nutritionPresentation.ts                # labels, icons, formatting
  nutritionSelectors.ts                   # React hooks — the only way components read this domain
  nutritionSample.ts                      # DEV sample history generator
  NutritionPanel.tsx                      # Dashboard section (log meal, summary, targets, trends)
src/features/insights/insightsNutrition.ts
src/dev/NutritionTestingTools.tsx
docs/NUTRITION.md                         # this file
```

**Rule:** React components never read `GameState.nutrition` or the logic modules directly — always go through `nutritionSelectors.ts`.

---

# UI

`NutritionPanel.tsx` is wired into `Dashboard.tsx` as its own section, directly below `WorkoutAnalyticsPanel`:

- **Today's summary** — meal badges, protein/calorie progress bars, missing-meals note, per-meal timing list (with delete)
- **Log a Meal** — meal type picker + one-or-more food entry rows (name/protein/carbs/fat/calories, all optional) + notes; expanded by default for fast logging
- **Nutrition Trends** — period filter (shared `AnalyticsPeriodFilter`) + protein/calorie trend charts
- **Nutrition Targets** — edit daily protein/calorie targets (water shown as "coming soon")

Deliberately lighter-weight than `WorkoutAnalyticsPanel` — Nutrition does not (yet) need its own Analytics Domain with Overview/Statistics/Recommendations sections; insights surface through the existing `InsightsDashboard`.

---

# React Selectors

`src/features/nutrition/nutritionSelectors.ts` is the **only** entry point components use:

| Hook | Returns |
|------|---------|
| `useTodayNutritionSummary()` | `DailyNutritionSummary` for the active Hero Day |
| `useNutritionSummaryForDay(heroDayKey)` | `DailyNutritionSummary` for an arbitrary day (History navigation) |
| `useNutritionAnalyticsInput()` | Base `NutritionAnalyticsInput` (memoized) |
| `useNutritionAnalytics(period)` | `NutritionAnalytics` |
| `useNutritionChartBundle(period)` | `NutritionChartBundle` |

Store actions (`src/store/gameStore.ts`): `logMeal(input)`, `deleteMealActivity(id)`, `updateNutritionTargets(patch)`.

---

# DevTools

`NutritionTestingTools.tsx`:

- **Log Sample Meal** — one realistic lunch entry
- **Generate Nutrition History** — backfills 14 days with intentional patterns tuned to clear the Insights thresholds above: breakfast skipped ~2 of every 3 days, dinner delayed ~2 of every 3 days, and the 5 most recent days boosted with an extra protein source (demonstrates a live protein-target streak)
- **Clear Nutrition Data** — resets to `createEmptyNutritionState()`
- **Dump Nutrition State** — raw JSON of `GameState.nutrition`

---

# Future Integrations (Extension Points — Not Implemented)

The data model reserves room for these without a schema rewrite:

| Extension | Where it plugs in |
|-----------|-------------------|
| Barcode scanning | Populates `FoodEntry` fields automatically; `integration.source = 'barcode_scan'` |
| Photo logging | Same — `integration.source = 'photo_log'` |
| Macro tracking (beyond protein/carbs/fat) | Additional optional `FoodEntry` fields |
| Micronutrients | New optional fields or a nested `micronutrients` bag on `FoodEntry` |
| Meal plans | A new planning layer that pre-fills `LogMealInput` — does not change `MealActivity` |
| Apple Health / Google Health Connect / MyFitnessPal / MacroFactor | `NutritionIntegration` (`source`, `externalEntryId`, `lastSyncedAt`, `syncToken`) already modeled on `MealActivity.integration` |

`NUTRITION_ENTRY_SOURCES` in `src/types/nutrition.ts` enumerates the sources above — the union exists today so future sync code has a stable type target, but nothing populates it yet.

---

# Out of Scope (Current Milestone)

- Stat bonuses / XP / gold from meal logging
- Resolving the legacy checkbox nutrition quests from meal activities
- Water intake logging (target field is a placeholder only)
- A dedicated Nutrition Analytics Domain (Overview/Statistics/Recommendations) — may follow the [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md) pattern in a later milestone
- Any of the Future Integrations listed above
