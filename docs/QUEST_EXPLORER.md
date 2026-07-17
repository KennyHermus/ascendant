# Quest Explorer

Version: aligned with Ascendant v0.0.4 (v0.0.3 Time & Quest Analytics milestone)

Dedicated per-quest analytics — **separate from Hero Timeline**.

---

# Purpose

Search any quest and inspect historical performance over Today / Week / Month / Lifetime (same period filter as Analytics).

Data source: **`GameState.questHistory`** (authoritative for per-quest stats), with live-today overlay from current quest state when the day is not yet snapshotted.

---

# Stats (per quest, per period)

- Lifetime / period completions & misses
- Completion rate
- Current & longest completion streak (consecutive Hero Days)
- Perfect / On Time / Completed (late) / Missed counts
- Average completion time (clock time)
- Average lateness (timed quests)
- Most common completion weekday
- Last completed / last missed (Hero Day + time)

---

# Visualizations

Uses existing Recharts infrastructure (`TimeSeriesLineChart`, `TimeSeriesBarChart`):

1. **Completion timeline** — completed days in range
2. **Completed vs Missed** — side-by-side daily bars
3. **Completion rate trend** — cumulative rate over the period
4. **Completion time trend** — minutes-from-midnight per completion day
5. **Punctuality distribution** — timed-quest offset histogram

Chart data is built in `questChartSelectors.ts` from filtered `questHistory` — no duplicate analytics math in components.

---

# Architecture

```
src/features/questExplorer/
  questAnalyticsLogic.ts      # Pure stats from questHistory
  questChartSelectors.ts      # ChartSeries builders
  questExplorerPresentation.ts
  questExplorerSelectors.ts   # React hooks
  QuestExplorerPanel.tsx      # Search + stats + charts
  QuestExplorerCharts.tsx
```

Dashboard placement: after **Analytics**, before **Insights**.

Cross-navigation: chart day clicks call `onDaySelect` → Hero History daily browser (same as Analytics charts).

---

# Related

- [TIME.md](TIME.md) — Hero Day, completion grades, timestamps
- [ANALYTICS.md](ANALYTICS.md) — aggregate punctuality metrics
- [INSIGHTS.md](INSIGHTS.md) — punctuality insight types
