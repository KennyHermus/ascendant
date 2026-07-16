# Ascendant Changelog

Release notes for shipped application versions. Design docs for unreleased systems live elsewhere (`COMBAT.md`, `STORY.md`, `FUTURE_IDEAS.md`, `IMPLEMENTATION_PLAN.md`).

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

**Not in v0.0.2:** History UI, Analytics, Combat, Inventory, Equipment, Story, World, Skills.

**Next:** [v0.0.3 — History & Analytics](IMPLEMENTATION_PLAN.md)

---

## v0.0.1

Foundation:

- Hero profile (level, XP, gold, stats)
- Quest completion with rewards
- localStorage persistence
- Single dashboard

Superseded in structure by v0.0.2 (Non-Negotiables, unlocks, timed quests, etc.).
