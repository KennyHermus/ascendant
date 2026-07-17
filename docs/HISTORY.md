# Ascendant History Foundation

Version: aligned with Ascendant v0.0.3 (History Foundation milestone)

> This document describes the **persistent History layer**. The read-only **Analytics Engine** that consumes it is documented in [ANALYTICS.md](ANALYTICS.md). Charts / Analytics UI are still not implemented.

---

# Purpose

History is permanent. It records the hero's progression over time so future Analytics can answer questions like:

- How did XP / level / stats change across weeks?
- What was quest completion rate?
- How consistent was the streak?

History is **written as gameplay occurs** (at day advance). It is **not** reconstructed by scanning current quest state (quests reset daily and cannot answer "what happened last Tuesday").

---

# Mental Model

| Layer | Role | Persisted? |
|-------|------|------------|
| **Events** (`GameState.events`) | Fine-grained "what happened" moments | Yes — but capped recent buffer (~50) for UI |
| **Daily Snapshot** (`HeroHistory.dailySnapshots`) | Compact end-of-day state for long-term trends | Yes — append-only, never overwritten |
| **Daily Summary** (`GameState.dailySummary`) | Player-facing recap UI for the just-ended day | Yes — presentation / report, not analytics DB |
| **Lifetime stats** (`Hero.lifetimeStats`) | Running counters on the hero | Yes — incremental, not a time series |
| **Analytics Engine** | Derived statistics (read-only) | No — computes from History / events / lifetime / hero |
| **Analytics Dashboard** | Presentation of Engine metrics | No — renders DTOs only |
| **Series builders** | Chart-ready points from snapshots | No — data only; Charts milestone renders |
| **Analytics Charts** (future) | Graphs / heatmaps | Will call series builders + Engine |

```
Gameplay (complete quest, miss, level up, …)
    → Events (recent buffer)
    → Lifetime stats (counters)
    → [day advances]
         → Daily Summary (UI recap — not Analytics input)
         → Daily Snapshot (immutable History record)
              → Analytics Engine (read-only stats)
                   → Analytics Dashboard (presentation)
                   → Series builders → Charts (future)
```

**Daily Summary vs Daily Snapshot**

- Summary = presentation for the player (modal/banner). Rich copy, major events list, tomorrow preview.
- Snapshot = database row for graphs. Small, stable schema, chronological series.

Do not treat Summary as the Analytics source of truth. Do not regenerate History by replaying the capped event buffer alone.

---

# Architecture

```
src/types/history.ts              # DailySnapshot, HeroHistory, HISTORY_SCHEMA_VERSION
src/features/history/historyLogic.ts  # pure build / record / query helpers (no UI)
src/store/gameStore.ts            # persists GameState.history; writes on day advance
src/dev/HistoryTestingTools.tsx   # DEV-only: generate / delete / reset / count
```

Logic stays UI-free. The store is the only write path in production (plus DEV helpers that only mutate `history`).

---

# Snapshot Schema (`DailySnapshot`)

Deliberately lean. Schema version is on each snapshot and on the parent `HeroHistory` document (`HISTORY_SCHEMA_VERSION = 1`).

| Field | Meaning |
|-------|---------|
| `schemaVersion` | Snapshot shape version |
| `date` | Quest-day key (`YYYY-MM-DD`) — same keying as daily reset / Sleep grace |
| `finalizedAt` | ISO timestamp from **application** time (supports simulated clock) |
| `level`, `currentXp`, `gold` | End-of-day hero wallet/progress |
| `currentStreak`, `longestStreak` | Streak at finalize |
| `questsCompleted`, `questsMissed` | Counts from quest **status** at finalize (not event buffer) |
| `xpEarned`, `goldEarned` | Day deltas vs `dayStartHeroSnapshot` lifetime totals |
| `stats` | Absolute stat values at end of day |
| `achievementIds`, `unlockIds` | Ids unlocked that day (from that day's events) |
| `totalQuestsCompleted`, `totalXpEarned`, `totalGoldEarned` | Lifetime totals at end of day (absolute series) |

Not stored (on purpose): full event payloads, per-quest checklists, Daily Summary copy, raw `GameEvent` arrays. Future entry types (`LevelHistoryEntry`, etc.) can be added later without rewriting this day rollup.

---

# Snapshot Lifecycle

1. **During the day** — events and lifetime stats update as usual. No snapshot yet for "today."
2. **When the quest day advances** — `applyPeriodResets` (advancing only, not simulated rewind):
   - Sweeps ending-day timed misses into events.
   - Finalizes Daily Summary for the ending day.
   - Builds a `DailySnapshot` from **pre-reset** hero/quests + `dayStartHeroSnapshot`.
   - Calls `recordDailySnapshot` — **idempotent**: if a snapshot for that `date` already exists, skip.
3. **Immutability** — once recorded for a date, production code never overwrites it.
4. **Simulated time** — uses `getCurrentGameTime()` / the same quest-day key as resets. Advancing the clock through a day boundary writes History the same way real time does. Rewinding does **not** delete or rewrite snapshots.

DEV tools can force-generate today's snapshot, delete the latest, or reset History only — for testing, not player UX.

---

# Persistence

- Field: `GameState.history: HeroHistory`
- `dailySnapshots` kept sorted by `date` ascending
- Survives refresh via Zustand `persist` + `localStorage`
- Save version: **`0.0.3`**
- Migration `0.0.2 → 0.0.3` adds empty `{ schemaVersion: 1, dailySnapshots: [] }` when missing
- `merge()` also defaults via `mergeHistory()` for safety
- `resetProgress()` clears History with the rest of the save; DEV "Reset History Only" clears only `history`

---

# Public API (`historyLogic.ts`)

| Function | Behavior |
|----------|----------|
| `createEmptyHistory()` | Empty document |
| `mergeHistory(persisted?)` | Safe default + chronological sort |
| `buildDailySnapshot(input)` | Pure builder (does not read/write History) |
| `recordDailySnapshot(history, snapshot)` | Append if date absent; else return same reference |
| `getHistory` / `getSnapshot(date)` / `getLatestSnapshot` / `getSnapshotCount` | Queries |
| `deleteLatestSnapshot` / `resetHistory` | DEV / repair helpers |

---

# Relationship to Analytics

The Analytics Engine ([ANALYTICS.md](ANALYTICS.md)) already:

1. Reads `GameState.history.dailySnapshots` via pure helpers.
2. Derives period stats from snapshot fields (`xpEarned`, `level`, completion counts, streak, …).
3. Optionally enriches the in-progress day with live state / recent events — not Daily Summary.

Analytics (and future UI) should **not**:

- Scan current `QuestState[]` for historical answers (live day only).
- Treat the 50-event buffer as complete long-term history.
- Rewrite or re-finalize past snapshots as part of chart rendering.

---

# Out of Scope (this milestone)

- Charts, graphs, heatmaps, calendar, History page, Analytics page
- Workout / nutrition tracking
- Expanding the recent-event buffer into unbounded storage (snapshots cover long-term day rollups)
