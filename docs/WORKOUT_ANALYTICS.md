# Workout Analytics

Version: aligned with Ascendant v0.0.4

Covers the **Analytics Domain architecture** and its first implementation, **Workout Analytics** — a dedicated fitness-insights dashboard separate from the core [Hero Analytics Dashboard](ANALYTICS.md).

See also: [ANALYTICS.md](ANALYTICS.md), [WORKOUT.md](WORKOUT.md), [PERFORMANCE.md](PERFORMANCE.md), [COACHING.md](COACHING.md).

---

# Why a Separate Domain

The core Analytics Dashboard (`features/analytics/`) is generic — Hero, Quest, Punctuality, and light Workout/Performance/Progression rollups, all built on `DailySnapshot` history.

Workout Analytics needs deeper, exercise- and template-level detail (per-exercise trends, per-template weak points, PR timelines, training balance) that would bloat the generic dashboard. Rather than growing `analyticsLogic.ts` indefinitely, or hard-coding a one-off "Workout tab," Ascendant introduces the **Analytics Domain** pattern: a reusable shape and reusable UI chrome that any future vertical (Nutrition, Finance, Learning, Combat, …) can adopt without redesigning navigation or components each time.

**Rule:** The core Analytics Dashboard is untouched by this feature. Workout Analytics is fully additive — its own section, own logic folder, own selectors.

---

# Analytics Domain Architecture

Defined in `src/types/analyticsDomain.ts`. Every Analytics Domain conceptually exposes five sections:

| Section | Role |
|---------|------|
| **Overview** | Top-line scalar metrics (dashboard headline numbers) |
| **Statistics** | Detailed per-entity breakdowns (drill-down lists) |
| **Visualizations** | Charts, built from `ChartSeries` via the existing `TimeSeriesLineChart` / `TimeSeriesBarChart` components |
| **Insights** | Objective, narrated observations — never prescriptive |
| **Recommendations** | Domain-specific coaching / suggested next actions |

```typescript
interface AnalyticsDomainModel {
  domainId: string
  title: string
  periodLabel: string
  overview: AnalyticsDomainOverviewMetric[]
  insights: AnalyticsDomainInsight[]
  recommendations: AnalyticsDomainRecommendationSummary[]
}
```

Shared UI chrome: `src/features/analytics/components/AnalyticsDomainPanel.tsx` renders Overview → Statistics → Visualizations → Insights → Recommendations (as accordions) consistently. A domain only supplies data + section content (`statistics`/`visualizations` as `ReactNode`); layout, empty states, and accordion persistence come for free.

**Workout Analytics is the first domain.** Future domains should follow the same shape and reuse `AnalyticsDomainPanel` rather than inventing new dashboard chrome.

---

# Data Flow

```
WorkoutActivity[] ─┐
PerformanceState ──┼─→ WorkoutAnalyticsInput ─→ domain logic modules ─→ presentation ─→ WorkoutAnalyticsPanel
CoachingState ──────┘
```

Workout Analytics consumes existing state only — it never duplicates persisted data:

| Consumes | Never |
|----------|-------|
| `GameState.workout.activities` | Recomputing PRs from raw sets |
| `GameState.performance` (Official PRs, PR history, assessments) | Storing its own copy of PR/assessment data |
| `GameState.coaching` (active recommendations) | Generating new coaching logic — reads Progression Engine output only |

`WorkoutAnalyticsInput` (`src/features/workoutAnalytics/workoutAnalyticsInput.ts`) is the single input shape shared by every module below — deliberately separate from the generic `AnalyticsInput` so the core engine never grows workout-specific fields.

---

# Module Map

```
src/features/workoutAnalytics/
  workoutAnalyticsInput.ts          # WorkoutAnalyticsInput + period/range helpers
  workoutDashboardLogic.ts          # Dashboard Overview (streak, totals, frequency, completion rate)
  exerciseAnalyticsLogic.ts         # Per-exercise stats (Exercise Analytics)
  workoutTemplateAnalyticsLogic.ts  # Per-template stats (Workout Analytics)
  trainingDistributionLogic.ts      # Training balance (Training Distribution)
  prAnalyticsLogic.ts               # Extends PerformanceAnalytics (PR Analytics)
  workoutCoachingSummaryLogic.ts    # Aggregates Progression Engine output (Coaching Integration)
  workoutAnalyticsChartSelectors.ts # ChartSeries bundle (Visualizations)
  workoutAnalyticsPresentation.ts   # Formatting + StatRow / AnalyticsDomain* builders
  workoutAnalyticsSelectors.ts      # React hooks — the only way components read this domain
  WorkoutAnalyticsPanel.tsx         # Top-level panel (wired into Dashboard.tsx)
  components/
    ExerciseAnalyticsSection.tsx
    WorkoutTemplateAnalyticsSection.tsx
    PrAnalyticsSection.tsx
    TrainingDistributionSection.tsx
    WorkoutAnalyticsCharts.tsx
```

**Rule:** React components never read `GameState` or the logic modules directly — always go through `workoutAnalyticsSelectors.ts`.

---

# Workout Dashboard (Overview)

`getWorkoutDashboardOverview(input, period)` → `WorkoutDashboardOverview`:

- `currentTrainingStreak` — consecutive Hero Days with a workout, independent of the quest streak
- `workoutsCompleted`, `averageDurationMinutes`, `totalDurationMinutes`
- `totalExercises`, `totalSets`, `totalReps`, `totalVolume`
- `workoutFrequencyPerWeek`, `completionRate`

Built on the existing `computeActivitiesStatistics()` utility (`workoutStatistics.ts`) — no duplicate aggregation logic.

---

# Exercise Analytics

`getExerciseAnalytics(input, exerciseId, period)` → `ExerciseAnalyticsStats`, for **every** catalog exercise (not just ones with history):

- `timesPerformed`, `totalSets`, `totalReps`
- `averageWeight`, `averageReps`, `averageDurationSeconds`, `averageVolume`
- `recentTrend` — `improving` / `declining` / `stable` / `insufficient_data` (first half vs second half of session values, ≥3 sessions required)
- `bestSession` — best single-session performance with a human-readable display string
- `officialPr` — from `PerformanceState.officialRecords` (read-only lookup, not recomputed)
- `trainingFrequencyPerWeek`, `lastPerformedAt`
- `currentRecommendation` — first active Progression Engine recommendation for that exercise

`getAllExerciseAnalyticsEntries()` / `getPracticedExerciseAnalyticsEntries()` / `searchExerciseAnalyticsEntries()` support the searchable exercise list in the UI.

---

# Workout (Template) Analytics

`getWorkoutTemplateAnalytics(input, templateId, period)` → `WorkoutTemplateAnalyticsStats`, for every known template (default catalog + any template id ever logged, e.g. Walk):

- `timesCompleted`, `completionRate`, `averageDurationMinutes`, `averageVolume`
- `mostDifficultSection` — lowest completed/total set ratio among the template's sections
- `mostSkippedExercise` — highest skip rate among exercises with ≥2 planned sets
- `currentRecommendation` — first active recommendation touching any exercise in the template
- `trainingFrequencyPerWeek`, `lastCompletedAt`

---

# PR Analytics

`getWorkoutPrAnalytics(input, period)` returns `WorkoutPrAnalytics`, which **extends** `PerformanceAnalytics` (`getPerformanceAnalytics()` — the existing PR data layer, see [PERFORMANCE.md](PERFORMANCE.md)) with two additional read-only rollups:

- `longestStandingPr` — oldest Official PR + days standing
- `prFrequencyPerMonth` — PRs earned normalized to a 30-day window

No PR data is recalculated — `currentOfficialPrs`, `recentPrs`, `mostImprovedExercises`, and `totalPrsEarned` all come straight from the existing engine.

---

# Training Distribution

`getTrainingDistribution(input, period)` computes five weighted breakdowns from completed sets (workout category weighted by workout count):

| Dimension | Buckets | Purpose |
|-----------|---------|---------|
| `byFamily` | Exercise Family | Which family dominates training |
| `byRole` | Foundation / Variation / Strength / Power / Skill / Accessory | Skill development balance |
| `byMuscleRegion` | Upper / Lower / Core / Full Body | Upper vs lower balance |
| `byTrainingType` | Strength / Cardio / Mobility | Cardio vs strength balance |
| `byWorkoutCategory` | Workout template | Which programs dominate |

Each bucket is `{ id, label, count, percent }`, sorted descending. The purpose is identifying **imbalance**, not just raw volume — see Coaching Integration below.

---

# Coaching Integration

`getWorkoutCoachingSummary(input, distribution, period)` → `WorkoutCoachingSummary` aggregates existing Progression Engine output (never generates new recommendations):

- `mostFrequentKinds` — from `getProgressionAnalytics()` (see [COACHING.md](COACHING.md))
- `highConfidenceRecommendations` — active recommendations with `high` / `very_high` confidence
- `readyForAssessment` — active `recommend_assessment` recommendations
- `trainingImbalanceSuggestions` — objective, distribution-derived observations (upper/lower skew, no cardio, no skill work, etc.), gated behind a minimum sample size (20 completed sets) to avoid noise

Imbalance suggestions are **derived from Training Distribution**, distinct from (and additive to) the Progression Engine's trend-based recommendations.

---

# Visualizations

`buildWorkoutAnalyticsChartBundle(input, period)` builds a `WorkoutAnalyticsChartBundle` of `ChartSeries` — rendered with the **existing** `TimeSeriesLineChart` / `TimeSeriesBarChart` components (no new charting code):

| Series | Chart |
|--------|-------|
| `workoutFrequency` | Workouts per day (bar) |
| `durationTrend` | Average duration trend (line) |
| `volumeTrend` | Average volume trend (line) |
| `exerciseFrequency` | Top 8 exercises by frequency (bar) |
| `prTimeline` | Official PRs earned per day (bar) |
| `workoutConsistencyByWeekday` | Workouts by weekday, Sun–Sat (bar) |
| `distributionByMuscleRegion` / `distributionByTrainingType` / `distributionByRole` | Training Distribution categorical breakdowns (bar) |

---

# UI

`WorkoutAnalyticsPanel.tsx` — wired into `Dashboard.tsx` directly below `PerformancePanel`, as its **own** section (not inside the core Analytics Dashboard).

- Header: shared `AnalyticsPeriodFilter` (Today, Last 7/30/90/180/365 Days), same rolling-window semantics as core Analytics
- Overview: dashboard metric tiles (`AnalyticsDomainPanel`)
- Statistics: nested accordions — Exercises (searchable), Workout Templates, Personal Records, Training Distribution
- Visualizations: chart grid
- Insights / Recommendations: narrated observations + coaching summary, rendered by the shared `AnalyticsDomainPanel` chrome

---

# React Selectors

`src/features/workoutAnalytics/workoutAnalyticsSelectors.ts` is the **only** entry point components use:

| Hook | Returns |
|------|---------|
| `useWorkoutAnalyticsInput()` | Base `WorkoutAnalyticsInput` (memoized) |
| `useWorkoutDashboardOverview(period)` | `WorkoutDashboardOverview` |
| `useExerciseAnalyticsEntries(period, query)` | Searchable, sorted `ExerciseAnalyticsEntry[]` |
| `useExerciseAnalyticsDetail(exerciseId, period)` | `ExerciseAnalyticsStats \| null` |
| `useWorkoutTemplateAnalyticsEntries(period)` | `WorkoutTemplateAnalyticsEntry[]` |
| `useWorkoutTemplateAnalyticsDetail(templateId, period)` | `WorkoutTemplateAnalyticsStats \| null` |
| `useTrainingDistribution(period)` | `TrainingDistribution` |
| `useWorkoutPrAnalytics(period)` | `WorkoutPrAnalytics` |
| `useWorkoutCoachingSummary(period)` | `WorkoutCoachingSummary` |
| `useWorkoutAnalyticsChartBundle(period)` | `WorkoutAnalyticsChartBundle` |
| `useWorkoutAnalyticsDomainModel(period)` | `AnalyticsDomainModel` (Overview/Insights/Recommendations for `AnalyticsDomainPanel`) |
| `useWorkoutAnalyticsState()` | Period + search + selection state for the panel |

---

# Extension Points (Future Domains)

To add a new Analytics Domain (Nutrition, Finance, Learning, Combat, …):

1. Define a `<Domain>AnalyticsInput` (read-only, consumes existing state — do not duplicate persisted data).
2. Write domain logic modules (overview, per-entity stats, distribution/insights as relevant).
3. Build a `ChartSeries` bundle and reuse `TimeSeriesLineChart` / `TimeSeriesBarChart`.
4. Write a presentation module producing `AnalyticsDomainOverviewMetric[]`, `AnalyticsDomainInsight[]`, `AnalyticsDomainRecommendationSummary[]`.
5. Expose everything through a dedicated `use<Domain>Analytics*` selector file — components never read domain logic or `GameState` directly.
6. Render with `AnalyticsDomainPanel`, supplying `statistics` / `visualizations` as `ReactNode`.
7. Wire the panel into `Dashboard.tsx` as its own section.

Do not extend `analyticsLogic.ts` / `AnalyticsDashboard.tsx` for domain-specific detail — that engine stays generic (Hero, Quest, Punctuality, light per-domain rollups only).

---

# Out of Scope

- Editing workout templates, exercises, or coaching from within Workout Analytics (read-only dashboard)
- New coaching logic (Workout Analytics surfaces Progression Engine output; it doesn't generate its own)
- Additional Analytics Domains beyond Workout (Nutrition, Finance, Learning, Combat — future)
