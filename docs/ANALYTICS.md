# Ascendant Analytics

Version: aligned with Ascendant v0.0.3 (Analytics Dashboard + stabilization)

Covers the **Analytics Engine**, **metric registry**, **series builders**, and **Analytics Dashboard**. Charts / graph libraries are **not** implemented yet.

---

# Data Flow

```
Events → Daily Snapshots → Analytics Engine → Selectors / Registry / Presentation → Dashboard
                                                      ↓
                                              Series builders → (future Charts)
```

| Layer | Role |
|-------|------|
| **Events** | Fine-grained recent moments (capped buffer) |
| **Daily Snapshots** | Long-term History day rollups |
| **Analytics Engine** | Pure derived stats (`analyticsLogic.ts`) |
| **Metric registry** | Declares which metrics exist and for which periods |
| **Presentation** | Formats Engine output into dashboard DTOs |
| **Series builders** | Snapshot → chart-ready points (no rendering) |
| **Dashboard** | Renders registry-filtered sections only |
| **Daily Summary** | Separate player report — **never** an Analytics input |

---

# Metric Registry

File: `src/features/analytics/analyticsMetricRegistry.ts`

Each scalar metric declares:

- `id`, `title`, `section`
- `supportedPeriods` — `'all'` or a subset of `today` | `week` | `month` | `lifetime`
- `resolve(analytics)` — reads Engine fields and returns display strings (formatting only)
- optional `rationale` (docs / maintainers)

The Dashboard builds sections by filtering the registry for the selected period. **React components do not contain period-visibility if/else lists.**

### Period policy (stabilization decisions)

| Metric | Periods | Decision |
|--------|---------|----------|
| Current Level | all | Always show as current-identity context |
| XP / Gold Earned | all | True period aggregates |
| Current Streak | today only | Live state — not a week/month/lifetime rollup |
| Longest Streak | week, month, lifetime | Peak streak in period (snapshot max + live today when in range); lifetime = all-time record |
| Quest totals / rates / timed | all | Period aggregates |
| Perfect Days | week, month, lifetime | Historical — day must be complete |
| Achievements unlocked/total/% | lifetime only | Catalog progress is lifetime |
| Days Tracked / Snapshots | week, month, lifetime | Finalized snapshots only — not in-progress Today |
| Average XP/Gold/Completion per day | week, month, lifetime | Averages need multiple days |
| Activity Breakdown / Non-Negotiable Breakdown rows | all | Period attempt stats from Engine |

Empty sections (e.g. Achievements on “This Week”, History on “Today”) are omitted entirely.

---

# Engine APIs

Periods: `today` | `week` | `month` | `lifetime` (application / simulated time).

| API | Returns |
|-----|---------|
| `getHeroAnalytics` | Level, highest level, totals, streaks |
| `getQuestAnalytics` | Completions, misses, rates, perfect days, by category/subcategory |
| `getTimedQuestAnalytics` | Timed success |
| `getProgressAnalytics` | XP / gold in period |
| `getHistoryAnalytics` | Snapshot counts + averages (period-aware) |
| `getAchievementAnalytics` | Unlocked count + % |
| `getAnalyticsForPeriod` / `getFullAnalytics` | Bundles |

---

# Series Builders (`analyticsSeries.ts`)

`buildXpSeries`, `buildGoldSeries`, `buildLevelSeries`, `buildStatSeries` / `buildAllStatSeries`, `buildQuestCompletedSeries`, `buildQuestMissedSeries`, `buildQuestCompletionSeries`, `buildAllChartSeries`.

Input: History `DailySnapshot[]`. Output: `ChartSeries { id, label, points }`.

---

# Selectors

| API | Role |
|-----|------|
| `usePeriodAnalytics(period)` | Memoized Engine bundle |
| `useAnalyticsDashboardModel(period)` | Engine → registry-filtered dashboard model |
| `useChartSeries()` | All series from History |
| `useAnalyticsDiagnostics()` | Snapshot / event counts |

---

# Architecture Separation

| Concern | Owns |
|---------|------|
| Events | What happened (recent buffer) |
| History | Immutable day rollups |
| Analytics Engine | Derived statistics (read-only) |
| Achievements | Milestone evaluation + rewards (gameplay adjacent) |
| Dashboard / Daily Summary | Presentation only |

Analytics must not import Daily Summary. UI must not recompute Engine math. Achievements must not depend on Analytics UI.

---

# Event coverage (audit)

**Emitted today**

| Action | Events |
|--------|--------|
| Quest completed | `QUEST_COMPLETED`, optional `LEVEL_UP`, `STREAK_*`, `UNLOCK_EARNED`, `ACHIEVEMENT_UNLOCKED` |
| Timed quest expired / miss sweep | `QUEST_FAILED` |
| Achievement unlock (evaluate / grantXp / Unlock All) | `ACHIEVEMENT_UNLOCKED`, optional `LEVEL_UP` from rewards |
| Streak change on reconcile | `STREAK_INCREASED` / `STREAK_BROKEN` |
| Unlock newly earned (via quest path) | `UNLOCK_EARNED` |

**Intentionally not evented**

| Gap | Rationale |
|-----|-----------|
| Per-tick XP / gold gain | Noisy; `LEVEL_UP` covers level thresholds; Analytics uses lifetime counters + snapshots |
| Dev force-reset quests / streak / achievements | Testing shortcuts — not gameplay |
| Day snapshot written | History layer, not Recent Progress |

**Fixed in stabilization**

- `grantXp` now evaluates achievements, updates lifetime XP, emits `LEVEL_UP` / `ACHIEVEMENT_UNLOCKED`
- DevTools Unlock All uses reward + event pipeline (`forceUnlockAchievements` + `applyAchievementRewards`)

---

# DevTools

Analytics panel:

- **View Analytics Object** — toggles formatted JSON inline
- **View Chart Series** — toggles full chart-ready datasets inline
- **Refresh Analytics** — recomputes and shows a confirmation line

Achievement panel:

- Evaluate / Unlock All / Reset — Unlock All grants rewards + events like a real unlock (conditions bypassed only)

---

# Out of Scope

- Chart libraries, graphs, timeline, heatmaps, calendar
- Workout analytics
- Persisted analytics tables
- New metrics beyond the registry cleanup
