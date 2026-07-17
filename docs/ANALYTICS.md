# Ascendant Analytics

Version: aligned with Ascendant v0.0.3 (Charts & Visualizations)

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

Uses **Recharts**. Shares the Dashboard period filter (Today / Week / Month / Lifetime).

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

---

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

---

# Out of Scope

- Hero Timeline
- Contribution calendar / heatmaps
- Workout / nutrition / combat analytics UI
