# Ascendant Time System

Version: aligned with Ascendant v0.0.4 (v0.0.3 Time & Quest Analytics milestone)

---

# Hero Day

Ascendant uses a **Hero Day** boundary instead of calendar midnight.

**Default boundary:** 5:00 AM local time.

Examples:

| Clock time | Calendar date | Hero Day key |
|------------|---------------|--------------|
| 1:00 AM Saturday | Saturday | Friday (`YYYY-MM-DD` of Friday) |
| 4:30 AM Monday | Monday | Sunday |
| 6:00 AM Monday | Monday | Monday |

Everything that previously used an implicit “today” now consumes Hero Day:

- Daily quest reset
- Streaks
- Unlocks
- Daily Summary
- History snapshots
- Analytics period bounds
- Insights
- Events (`heroDayKey` on quest events)
- Hero Timeline & Contribution Calendar

---

# Time Service

Central module: `src/lib/timeService.ts`

| Function | Purpose |
|----------|---------|
| `getHeroDayKey(now)` | Hero Day key for a timestamp |
| `getActiveHeroDayKey(now)` | Alias used as “today” |
| `getHeroYesterdayKey(now)` | Previous Hero Day |
| `getHeroDayStart(key)` / `getHeroDayEnd(key)` | Inclusive start / exclusive end |
| `getHeroWeekKey(now)` | ISO week from Hero Day date |
| `getHeroMonthKey(now)` | `YYYY-MM` from Hero Day date |
| `addHeroDays(key, n)` | Shift a Hero Day key |
| `getHeroDayKeyForTimestamp(iso)` | Resolve key for history records |

Quest code re-exports `getActiveQuestDayKey()` from `questDay.ts` — a thin wrapper over `getActiveHeroDayKey()`.

**Rule:** Do not duplicate date math in features. Import from `timeService`.

Simulated / dev time flows through `getCurrentGameTime()`; Time Service accepts an optional `now` argument.

---

# Completion Timestamps

Every completed quest stores:

- `completedAt` — ISO timestamp (game time)
- `completionGrade` — `perfect` | `onTime` | `completed`
- `heroDayKey` — on events and `questHistory` records

Timed quests compare `completedAt` against target time + grace for grading.

Future workout / nutrition / combat systems should reuse `completedAt` — do not invent parallel timestamp fields.

---

# Completion Grades (Timed Quests)

| Grade | Condition | XP / Gold / Stat multiplier |
|-------|-----------|------------------------------|
| **Perfect** | Before target time | 1.15× |
| **On Time** | Target → grace end | 1.05× |
| **Completed** | After grace, before Hero Day end | 1.00× |
| **Missed** | Hero Day ends without completion | — |

Late completions still:

- Award rewards (with 1.00× multiplier)
- Count for streaks, unlocks, Today's Journey, analytics, snapshots, and history events

`minutesOffset` (minutes relative to target; negative = early) is stored on completion records for punctuality analytics.

Misses are finalized at **Hero Day advance** — timed quests stay `available` after grace until the day ends.

---

# Persistence

Save version **0.0.4** adds:

- `GameState.questHistory` — append-only completion / miss log
- Quest state fields `completedAt`, `completionGrade`

Migration: `0.0.3 → 0.0.4` in `src/lib/migrations/migrations.ts`.
