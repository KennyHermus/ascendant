# Ascendant Analytics

Version: aligned with Ascendant v0.0.4 (Performance & PR data layer)

Covers the **Analytics Engine**, **metric registry**, **series builders**, **Analytics Dashboard**, and **Charts**.

---

# Data Flow

```
Events → Daily Snapshots → Analytics Engine → Selectors / Registry → Dashboard metrics
                              ↓
                    filterSnapshotsForPeriod()
                              ↓
                       Series Builders → ChartSeries → Charts (Recharts)
```

| Layer | Role |
|-------|------|
| **Daily Snapshots** | Long-term History day rollups |
| **Analytics Engine** | Pure derived stats (`analyticsLogic.ts`) — **never changed by charts** |
| **Metric registry** | Scalar dashboard metrics + period visibility |
| **Series builders** | Snapshot → `ChartSeries` (`analyticsSeries.ts`) |
| **Chart selectors** | Period filter + builders → `PeriodChartBundle` |
| **Charts** | Recharts UI — consumes `ChartSeries` only |
| **Daily Summary** | Presentation only — **never** an Analytics input |

**Rule:** React chart components never read `history.dailySnapshots` or recompute analytics.

---

# Charts (`AnalyticsCharts.tsx`)

Uses **Recharts**. Shares the Dashboard period filter — rolling windows only (not calendar weeks/months):

| Period | Range |
|--------|-------|
| Today | Active quest day only |
| Last 7 Days | Previous 7 calendar days ending today |
| Last 30 / 90 / 180 / 365 Days | Previous N calendar days ending today |

Shared resolution: `resolvePeriodRange()` in `analyticsPeriods.ts` (`addHeroDays(today, -(N-1))` … `today`).

**Cross-navigation:** optional `onDaySelect(date)` on line/bar charts — clicking a point opens Hero History Daily Browser for that quest-day (wired from Dashboard).

### Hero Progress
- Level over time (line)
- XP earned per day (bar)
- Gold earned per day (bar)

### Quest Progress
- Daily completion % (line, 0–100%)
- Quests completed per day (bar)
- Quests missed per day (bar)

### Attribute Growth
- Dropdown: all eight stats
- Selected attribute over time (line)

Empty state when no finalized snapshots exist in the period.

---

# Chart Architecture

```
src/features/analytics/
  analyticsChartSelectors.ts   # buildPeriodChartBundle (filter → builders)
  chartPresentation.ts         # seriesToChartData, date labels (no snapshots)
  AnalyticsCharts.tsx          # chart sections only
  components/
    ChartPanel.tsx             # title + empty state wrapper
    TimeSeriesLineChart.tsx    # reusable line chart
    TimeSeriesBarChart.tsx     # reusable bar chart
    chartTheme.ts              # RPG-aligned colors
```

### ChartSeries

```typescript
interface ChartSeries {
  id: string
  label: string
  points: { date: string; value: number }[]
}
```

Built by: `buildXpSeries`, `buildGoldSeries`, `buildLevelSeries`, `buildStatSeries`, `buildQuestCompletedSeries`, `buildQuestMissedSeries`, `buildQuestCompletionSeries`.

### Period bundle

`buildPeriodChartBundle(input, period)` → named series for charts.  
Hook: `usePeriodChartBundle(period)`.

---

# Extending charts (future systems)

Workout, Nutrition, Combat, Economy should:

1. Add fields to `DailySnapshot` (or new History entry types) when gameplay writes them.
2. Add a `build*Series(snapshots)` in `analyticsSeries.ts`.
3. Expose via `PeriodChartBundle` (or a domain-specific bundle).
4. Render with existing `TimeSeriesLineChart` / `TimeSeriesBarChart`.

Do not read snapshots in React. Do not duplicate Engine calculations in chart components.

### Workout analytics (v0.0.4 foundation)

`AnalyticsInput.workoutActivities` feeds `getWorkoutAnalytics()`:

- `workoutsCompleted`, `totalExercises`, `totalSets`
- `totalDurationMinutes`, `averageDurationMinutes`

Exposed on `PeriodAnalytics.workouts`. Source of truth is `GameState.workout.activities`, not quest state.

This light rollup stays part of the core engine. Deeper per-exercise, per-template, PR, and training-distribution analytics live in the dedicated **Workout Analytics** domain — its own Dashboard section, separate from this one. See [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md) and the **Analytics Domain** architecture it introduces.

### Performance analytics (v0.0.4)

`AnalyticsInput.performance` feeds `getPerformanceAnalytics()`:

- `currentOfficialPrs` — current Official Personal Records
- `recentPrs` — PR history entries in the period
- `mostImprovedExercises` — largest improvements by exercise
- `totalPrsEarned` — count of PR updates in the period
- `baselineCompleted`, `assessmentsCompleted`

Exposed on `PeriodAnalytics.performance`. Charts not built yet — data layer only. See [PERFORMANCE.md](PERFORMANCE.md).

### Progression analytics (v0.0.4)

`AnalyticsInput.coaching` feeds `getProgressionAnalytics()`:

- `totalRecommendations`, `recentRecommendations`
- `mostFrequentKinds`, `mostActiveFamilies`
- `confidenceDistribution`, `activeRecommendationCount`

Exposed on `PeriodAnalytics.progression`. See [COACHING.md](COACHING.md).

**Rule:** Normal workouts never overwrite Official PRs; analytics reads PR data from `GameState.performance`, not workout logs.

### Nutrition analytics (v0.0.4)

`NutritionAnalyticsInput` (a narrow input — `nutrition`, `questDefinitions`, `now` — structurally compatible with `AnalyticsInput`) feeds `getNutritionAnalytics()`:

- `mealsLogged`, `daysTracked`, `averageProteinPerDay`, `averageCaloriesPerDay`
- `proteinTargetAdherenceRate`, `calorieTargetAdherenceRate`, `mealConsistencyRate`
- `currentMealLoggingStreak`, `currentProteinTargetStreak`, `currentMealConsistencyStreak`
- `missedMealCounts`, `averageMealTimeMinutes` (per meal type)

Exposed on `PeriodAnalytics.nutrition`. Source of truth is `GameState.nutrition.activities`. Protein/calorie trend charts reuse `TimeSeriesLineChart` via `buildNutritionChartBundle()`. See [NUTRITION.md](NUTRITION.md).

# Metric Registry

See `analyticsMetricRegistry.ts` for scalar dashboard period rules.

---

# Engine APIs

Unchanged — charts do not modify Engine output.

---

# DevTools

- View Analytics Object (JSON)
- View Chart Series with **period filter** (full point data)
- Refresh with confirmation + point counts

Hero History DevTools (see [HISTORY.md](HISTORY.md)): generate sample history, inspect snapshot JSON, jump to date.

---

# Hero History (see [HISTORY.md](HISTORY.md))

Implemented in v0.0.3 — separate Dashboard section, shares History data with Analytics:

- Contribution calendar (completion heatmap)
- Hero Timeline (filtered event feed)
- Daily History Browser (modal)
- Chart / calendar / timeline / achievement cross-navigation

---

# Out of Scope

- Combat analytics UI
- Deep workout analytics UI (see [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md) — implemented as its own Analytics Domain, not part of this dashboard)
- A dedicated Nutrition Analytics Domain UI (light rollup only — see [NUTRITION.md](NUTRITION.md); may follow the Workout Analytics pattern in a later milestone)

---

# Punctuality Analytics (v0.0.4)

Derived from `GameState.questHistory` completion records for timed quests.

| Metric | Description |
|--------|-------------|
| Perfect Rate | Share of timed completions graded `perfect` |
| On-Time Rate | Share graded `onTime` |
| Punctual Rate | Perfect + On Time |
| Avg Minutes Late | Mean positive `minutesOffset` |
| Avg Minutes Early | Mean early offset (absolute) |
| Avg Completion Time | Mean clock time of completions |

Engine: `getPunctualityAnalytics()` in `analyticsLogic.ts`.  
Dashboard section: **Punctuality** via metric registry.

Per-quest punctuality detail lives in **Quest Explorer** — see [QUEST_EXPLORER.md](QUEST_EXPLORER.md).

Hero Day boundaries for period filters: [TIME.md](TIME.md).

---

# Quest Explorer (see [QUEST_EXPLORER.md](QUEST_EXPLORER.md))

Per-quest stats and charts — separate Dashboard section, same period filter as Analytics.

---

# Workout Analytics (see [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md))

The first **Analytics Domain** — dedicated fitness dashboard (per-exercise, per-template, PR, and training-distribution analytics + coaching integration). Separate Dashboard section; this core dashboard is unmodified.

---

# Insights Engine (see [INSIGHTS.md](INSIGHTS.md))

Implemented in v0.0.3 — interprets Analytics / History into behavioral Insight Cards.
Analytics remain objective statistics; Insights never coach or recommend.

---

# Nutrition (see [NUTRITION.md](NUTRITION.md))

Implemented in v0.0.4 — meal logging, Daily Nutrition Summary, configurable targets, and light Analytics rollup (above). Its own Dashboard section (`NutritionPanel`), separate from this core dashboard.
