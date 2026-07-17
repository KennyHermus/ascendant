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

**Not yet in v0.0.3:** Charts, graphs, timeline, heatmaps, calendar, workout tracking.

**Next within v0.0.3:** Charts & Visualizations (consume series builders).

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
