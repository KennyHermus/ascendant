# Ascendant Insights Engine

Version: aligned with Ascendant v0.0.3 (Behavior Analytics / Insights)

> Interprets **Analytics** and **History** into behavioral patterns. Does **not** coach, recommend, or change goals.

---

# Purpose

The Insights Engine answers questions Analytics alone does not narrate:

- Which quests and routines are strengths vs soft spots?
- Is completion improving or declining?
- Which weekdays and weeks perform best?
- Where do streaks tend to break?
- How do timed quests land relative to their targets?

**Analytics** compute objective statistics.  
**Insights** interpret those patterns into readable cards.

Future intelligent systems (coaching, adaptive goals, recommendations) should **consume Insights** — they are out of scope here.

---

# How Insights Differ from Analytics

| | Analytics Engine | Insights Engine |
|--|------------------|-----------------|
| Output | Numbers, rates, series | Titles, explanations, supporting metrics |
| Role | Measure | Interpret |
| Mutates state? | Never | Never |
| Coaching / advice? | No | **No** (by design) |
| UI | Metric cards, charts | Insight Cards |

Do **not** merge these responsibilities. Dashboard sections stay separate.

---

# Data Flow

```
Events
  → History (Daily Snapshots)
    → Analytics Engine (objective stats)
      → Insights Engine (interpretations)
        → Insights Dashboard (Insight Cards)
```

Rules:

1. Insights consume `AnalyticsInput` (same assembly as Analytics) plus period helpers.
2. Routine insights call `getQuestAnalytics` — they do not re-derive category rates.
3. Trend insights prefer durable **snapshots**; quest-level timing uses the recent **event buffer**.
4. React components never read snapshots directly or recompute Engine math.
5. No duplicate History storage.

---

# Architecture

```
src/types/insights.ts                 # Insight, PeriodInsights, kinds
src/features/insights/
  insightsLogic.ts                    # generateInsightsForPeriod / generateFullInsights
  insightsHelpers.ts                  # per-quest profiles, range splits, formatting
  insightsQuest.ts                    # quest interpretations
  insightsRoutine.ts                  # routine interpretations (via Analytics)
  insightsTrends.ts                   # behavior trends from snapshots
  insightsPresentation.ts             # dashboard view-model
  insightsSelectors.ts                # React hooks + DevTools select
  insightsSample.ts                   # DEV sample History + events
  InsightsDashboard.tsx               # Dashboard section
  components/InsightCard.tsx          # reusable card
src/dev/InsightsTestingTools.tsx
docs/INSIGHTS.md                      # this file
```

---

# Supported Insight Types

## Quest Insights

| Type | Meaning |
|------|---------|
| `mostCompletedQuest` | Highest completion count |
| `mostMissedQuest` | Highest miss count |
| `highestCompletionRate` | Best rate (≥2 attempts) |
| `lowestCompletionRate` | Worst rate (≥2 attempts) |
| `mostImprovedQuest` | Largest rate gain, later half vs earlier half |
| `mostDecliningQuest` | Largest rate drop across halves |
| `mostCommonStreakBreaker` | Streak-contributing quest missed on streak-break days |
| `mostMissedTimedQuest` | Timed quest with most misses |
| `averageTimedCompletionOffset` | Avg minutes vs target (recent timed completions) |
| `lateButSuccessful` | Completions inside grace after target |
| `mostFrequentlyLate` | Timed quest with most `completed` (late) grades |
| `improvingPunctuality` | Offset closer to target in later half of period |
| `decliningPunctuality` | Offset drifting later in period |
| `consistentlyEarly` | High share of `perfect` grades (≥3 attempts) |
| `consistentlyInGrace` | High share of `onTime` grades (≥3 attempts) |

Quest attempt profiles prefer **`questHistory`** for non-lifetime periods; event buffer is fallback only. Punctuality insights read `questHistory.completions` with `minutesOffset` and `grade`.

Timing insights using events remain **confidence-limited** by the ~50 event buffer — punctuality insights from `questHistory` are durable.

## Routine Insights

| Type | Meaning |
|------|---------|
| `routineCompletion` | Per-subcategory rate (Morning / Nutrition / Evening) |
| `strongestRoutine` | Highest Non-Negotiable subcategory rate |
| `weakestRoutine` | Lowest Non-Negotiable subcategory rate |
| `weeklyCategoryCompletion` | Combined Weekly + Weekly Bonus rate |

## Behavior Trends

| Type | Meaning |
|------|---------|
| `completionImproving` / `completionDeclining` | Snapshot completion rate, later half vs earlier |
| `missFrequencyIncreasing` / `missFrequencyDecreasing` | Avg misses/day across halves |
| `mostProductiveWeekday` / `leastProductiveWeekday` | Weekday avg completion from snapshots |
| `bestPerformingWeek` | ISO week with best avg completion |

Each insight may include optional **confidence** (`low` / `medium` / `high`) and **severity** (`positive` / `neutral` / `attention`).

---

# Insight Card

Reusable presentation component:

- **Title** — short pattern name
- **Explanation** — what the pattern means (not advice)
- **Supporting metric** — label + value
- **Confidence** (optional)
- **Severity / priority** (optional badge: Strength / Pattern / Watch)

---

# Insight Generation Flow

1. UI / DevTools call `selectAnalyticsInput` (store + definitions + clock).
2. `generateInsightsForPeriod(input, period)` runs pure generators.
3. Quest / Routine / Trend arrays are assembled into `PeriodInsights`.
4. `buildInsightsDashboardModel` maps to accordion sections.
5. `InsightCard` renders each insight.

Insufficient evidence → empty arrays (empty-state copy in UI). Never invent coaching.

---

# DevTools

- **Generate Sample Insight Data** — synthetic snapshots + timed/streak quest events
- **Refresh Insights** — recompute with current store
- **View Raw Insights Object** — JSON dump of `PeriodInsights`

---

# Explicitly Out of Scope

- AI-generated coaching
- Recommendations (“do X tomorrow”)
- Adaptive rewards
- Automatic goal changes

Those systems should **read** Insights in a later version.

---

# Future Extension Points

| Domain | How to extend |
|--------|----------------|
| **Workout analysis** | Add workout fields to `DailySnapshot` → Analytics series → new Insight kinds (PR stagnation, volume trends) |
| **Nutrition analysis** | Snapshot / event nutrition signals → routine-style insight cards |
| **Recovery analysis** | Sleep/rest markers on History → trend insights |
| **Combat analysis** | v0.1.x combat results → performance insights consuming Analytics combat stats |

Pattern for each:

1. Persist durable day rollups in History (not unbounded events).
2. Expose objective metrics in the Analytics Engine.
3. Add Insight generators that **interpret** those metrics.
4. Render with existing `InsightCard` — no new card architecture required.

---

# Relationship to Other v0.0.3 Systems

- [HISTORY.md](HISTORY.md) — durable day rollups + Hero History UI
- [ANALYTICS.md](ANALYTICS.md) — objective stats + charts
- Insights sit **after** Analytics in the pipeline and share period filters (`today` / `week` / `month` / `lifetime`)
