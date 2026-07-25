# Ascendant Changelog

Release notes for shipped application versions. Design docs for unreleased systems live elsewhere (`COMBAT.md`, `STORY.md`, `FUTURE_IDEAS.md`, `IMPLEMENTATION_PLAN.md`).

---

## v0.0.3 (in progress)

### History Foundation

- **Long-term History** — append-only `DailySnapshot` records on `GameState.history`
- Written when the quest day advances (idempotent per date; application/simulated time)
- Save version `0.0.3` + migration from `0.0.2`
- History DevTools for testing (does not affect quests/hero/events)
- Docs: [HISTORY.md](HISTORY.md)

### Analytics Engine

- **Read-only Analytics** — `features/analytics/` derives hero / quest / timed / progress / history / achievement stats
- Period filters: today, week, month, lifetime (application / simulated time)
- Consumes History snapshots, lifetime stats, hero state, definitions, recent events
- Analytics DevTools (view object, refresh, snapshot/event counts) — never mutates state

### Analytics Dashboard

- Presentation Dashboard on the Hero screen with period filters and metric sections
- **Metric registry** (`analyticsMetricRegistry.ts`) — period visibility declared per metric, not in JSX
- Chart series builders (`buildXpSeries`, …) — no chart rendering yet
- Stabilization: grantXp unlocks achievements; Unlock All uses reward/event pipeline; DevTools analytics panels show inline JSON
- Docs: [ANALYTICS.md](ANALYTICS.md)

### Charts & Visualizations

- Recharts charts (Hero / Quest / Attribute Growth) via `ChartSeries` + period filter
- DevTools period-scoped series viewer
- Docs: [ANALYTICS.md](ANALYTICS.md)

### Hero History

- **Hero Timeline** — reverse-chronological event feed, day groups, filters (All / Progress / Quests / Achievements / Unlocks), search
- **Contribution Calendar** — GitHub-style heatmap (26 weeks), completion intensity, future dates disabled
- **Daily History Browser** — level, stats, XP/gold, quests, achievements, unlocks, Daily Summary when available
- **Cross-navigation** — chart points, calendar, timeline, unlocked achievements → daily view
- History DevTools: generate sample history, inspect snapshot JSON, jump to date
- Docs: [HISTORY.md](HISTORY.md)

### Insights Engine

- **Behavior Analytics / Insights** — interprets Analytics + History into Insight Cards
- Quest, Routine, and Behavior Trend patterns (no coaching / recommendations)
- Insights DevTools: sample data, refresh, raw object viewer
- Docs: [INSIGHTS.md](INSIGHTS.md)

### Time, History & Quest Analytics (final v0.0.3 milestone)

- **Hero Day** — 5:00 AM day boundary via centralized Time Service ([TIME.md](TIME.md))
- **Completion timestamps** — `completedAt` on all quests; timed grading (Perfect / On Time / Completed / Missed) with reward multipliers (1.15× / 1.05× / 1.00×)
- **Quest History** — append-only `GameState.questHistory` for long-term per-quest records (save `0.0.4`)
- **Quest Explorer** — search, per-quest stats, and charts ([QUEST_EXPLORER.md](QUEST_EXPLORER.md))
- **Punctuality analytics** — perfect/on-time rates, avg early/late, completion time trends
- **Punctuality insights** — most frequently late, improving/declining punctuality, consistently early / in grace

**v0.0.3 complete** (History → Analytics → Charts → Hero History → Insights → Time & Quest Analytics).

---

## v0.0.4 (in progress)

### Fitness Foundation

- **Activity architecture** — Quest vs Activity separation; only WorkoutActivity implemented ([ACTIVITIES.md](ACTIVITIES.md))
- **Workout data model** — exercises, templates, sessions, activities ([WORKOUT.md](WORKOUT.md))
- **Workout completion pipeline** — `completeWorkout()` reuses `completeQuest('workout')` + `WORKOUT_COMPLETED` event
- **Analytics** — `PeriodAnalytics.workouts` from `WorkoutActivity` records
- **Insights** — `workoutVolume` insight type
- **UI** — Workout panel (start, log sets, complete)
- **DevTools** — workout testing helpers
- Save version **0.0.5**

### Workout Logging & Sessions

- Full session lifecycle (draft, start, pause, resume, review, complete)
- Set logging with `completed` status, weight, reps — extensible fields bag
- `workoutStatistics.ts` — reps, volume, frequency rollups
- Today's Journey workout progress row
- Timeline rich summaries + WorkoutDetailModal
- Daily Summary reflection for logged workouts
- DevTools: generate/complete sample workout, generate/clear history

### Performance & Personal Records

- **Hero Assessment architecture** — Fitness → Baseline / Performance Assessments ([PERFORMANCE.md](PERFORMANCE.md))
- **Baseline Assessment** — dedicated activity; establishes initial Official PRs
- **Performance Assessments** — intentional benchmark tests; separate from workouts
- **Official PRs** — highest weight/reps/duration/distance/volume; updated only from assessments
- **Exercise Families** — push-up, plank, squat, curl, walking families with stable exercise ids
- **PR history** — append-only log; never overwrites prior records
- **Timeline** — `PERSONAL_RECORD_ACHIEVED` events under Progress filter
- **Analytics** — `PeriodAnalytics.performance` (current PRs, history, most improved, totals)
- **Progression extension points** — stub interfaces for future recommendations
- Save version **0.0.6**

### Exercise Progression Engine

- **Coaching recommendations** — multi-workout trends + Official PRs + prerequisites ([COACHING.md](COACHING.md))
- **Exercise Roles** — foundation, variation, strength, power, skill, accessory
- **Exercise Prerequisites** — Tiger Bend, One-arm, Planche readiness (no linear paths)
- **Recommendation kinds** — increase weight/reps, maintain, reduce, assessment, advanced exercise, consistency, recovery
- **Confidence levels** — low / medium / high / very high
- **Workout integration** — per-exercise coaching banners (informational only)
- **Timeline** — `COACHING_RECOMMENDATION` events under Progress filter
- **Analytics** — `PeriodAnalytics.progression`
- **Future hooks** — Exercise Mastery, readiness, fatigue, estimated PRs
- Save version **0.0.7**

### Workout Analytics

- **Analytics Domain architecture** — `types/analyticsDomain.ts` + shared `AnalyticsDomainPanel` UI chrome; reusable for future domains (Nutrition, Finance, Learning, Combat, …) ([WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md))
- **Workout Analytics** — the first Analytics Domain; dedicated Dashboard section, separate from and non-modifying of the core Analytics Dashboard
- **Workout Dashboard** — training streak, workouts completed, average/total duration, total exercises/sets/reps/volume, frequency, completion rate
- **Exercise Analytics** — per-exercise times performed, averages (weight/reps/duration/volume), recent trend, best session, official PR, training frequency, current recommendation — searchable list covering the full exercise catalog
- **Workout (Template) Analytics** — per-template times completed, completion rate, average duration/volume, most difficult section, most skipped exercise, current recommendation
- **PR Analytics** — extends the existing `PerformanceAnalytics` data layer with longest-standing PR and PR frequency per month (no PR data duplicated)
- **Training Distribution** — exercise family, exercise role, muscle region (upper/lower/core), training type (strength/cardio/mobility), and workout category, weighted by completed sets
- **Coaching Integration** — most common / high-confidence recommendations, exercises ready for assessment, and distribution-derived training imbalance suggestions, all read from the existing Progression Engine output
- **Visualizations** — workout frequency, duration/volume trend, exercise frequency, PR timeline, workout consistency by weekday, training distribution charts — reuses `TimeSeriesLineChart` / `TimeSeriesBarChart`
- **Selectors** — `workoutAnalyticsSelectors.ts` is the sole React entry point; no component reads `GameState` or domain logic directly
- No new persistence — consumes `WorkoutActivities`, `PerformanceState`, and `CoachingState` only

### Nutrition System

- **Meals as Hero Activities** — `MealActivity` (`'nutrition'` kind), instant/completed records with no session lifecycle; `questId` always `null` ([NUTRITION.md](NUTRITION.md))
- **Food Entry model** — optional name, protein, carbs, fat, calories, notes; empty rows dropped on save
- **Configurable Nutrition Targets** — protein, calories, water (placeholder); editable in-app via `updateNutritionTargets()`, not hardcoded
- **Daily Nutrition Summary** — meals logged, nutrient totals, target completion %, meal timing, missed required meals
- **Hero integration events** — `NUTRITION_MEAL_LOGGED`, `NUTRITION_TARGET_ACHIEVED`; timeline-integrated (Quest / Progress filters); no stat/XP/gold rewards yet by design
- **Analytics** — `PeriodAnalytics.nutrition` (protein/calorie trends, target adherence, meal consistency, streaks, missed-meal counts, average meal timing) via a narrow `NutritionAnalyticsInput`; protein/calorie trend charts reuse `TimeSeriesLineChart`
- **Insights** — protein target streak, meal consistency, missed-meal pattern, meal-timing drift (`insightsNutrition.ts`)
- **UI** — `NutritionPanel` (log meal, daily summary, targets editor, trend charts), its own Dashboard section
- **DevTools** — log sample meal, generate 14-day sample history (tuned to surface each insight type), clear data, dump state
- **Extension points** — `NutritionIntegration` + `NUTRITION_ENTRY_SOURCES` model barcode scan / photo log / Apple Health / Google Health Connect / MyFitnessPal / MacroFactor sync; not implemented
- Save version **0.0.8**

### v0.0.4 Integration & Polish (complete)

- **Nutrition ↔ Quest integration** — meal logging auto-completes breakfast/lunch/dinner quests; protein target met completes `vitamins-protein`; full `completeQuest()` pipeline (XP, gold, stats, events, history, analytics, insights, streaks, unlocks); quest revert on meal delete
- **Unified rolling analytics time windows** — Today, Last 7/30/90/180/365 Days across Hero, Quest, Workout, Nutrition, Quest Explorer, and Insights; shared `resolvePeriodRange()` (no calendar weeks/months or unbounded lifetime filter)
- **Hero Dashboard coaching** — top coaching recommendations surfaced in Today's Journey (workout progression + protein-target nudge)
- **Fitness Settings** — `GameState.fitnessSettings` (protein/calorie/water targets, preferred units, workout prefs placeholder); synced to `nutrition.targets`; save **0.0.9**
- **Activity registry** — nutrition quest ids in `ACTIVITY_DRIVEN_QUEST_IDS`; QuestCard shows "Use Nutrition panel"

**v0.0.4 complete.**

---

## v0.0.2

Completed features:

- **Hero Dashboard** — Hero Banner (title, status, next objective, lifetime stats), Today's Journey, Active Objectives, Recent Progress, Attributes; accordion organization
- **Daily Summary** — end-of-day recap using period-generic `SummarySnapshot` (daily implemented; weekly/monthly-ready shape)
- **Achievements** — data-driven catalog, rarity, Achievement Points, unlock popup + panel
- **Event tracking foundation** — `GameEvent` recent buffer (Recent Progress / Daily Summary); not long-term History storage
- **Timed quests** — target times, grace periods, weekday-only schedules; developer time simulation
- **Unlock quests** — Messages, YouTube, Gaming, Social Media, Netflix (recomputed from quest state)
- **Quest hierarchy improvements** — Non-Negotiables (Morning Routine, Nutrition, Evening Routine), Daily Bonus, Weekly, Weekly Bonus; optional quests; weekday schedules; streak contribution flags
- **Progress aggregation utilities** — shared `questProgress.ts` for category/subcategory completed/total/percent
- **Lifetime statistics** — incremental counters on the hero (including per-quest completion counts)
- **Category / subcategory completion rewards**

**Not in v0.0.2:** History storage/UI, Analytics, Combat, Inventory, Equipment, Story, World, Skills.

**Next:** [v0.0.3 — History Foundation ✓ / Analytics Engine next](IMPLEMENTATION_PLAN.md)

---

## v0.0.1

Foundation:

- Hero profile (level, XP, gold, stats)
- Quest completion with rewards
- localStorage persistence
- Single dashboard

Superseded in structure by v0.0.2 (Non-Negotiables, unlocks, timed quests, etc.).
