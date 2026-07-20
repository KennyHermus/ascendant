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
