# Ascendant History Foundation

Version: aligned with Ascendant v0.0.3 (Hero History complete)

> Persistent History layer + **Hero History UI** (Timeline, Calendar, Daily Browser). The read-only **Analytics Engine** is documented in [ANALYTICS.md](ANALYTICS.md).

---

# Purpose

History is permanent. It records the hero's progression over time so Analytics and Hero History can answer questions like:

- How did XP / level / stats change across weeks?
- What was quest completion rate?
- How consistent was the streak?
- What happened on a specific past day?

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
| **Analytics Dashboard** | Presentation of Engine metrics + Charts | No — renders DTOs only |
| **Hero History UI** | Timeline, calendar, daily browser | No — reads History + events + optional Summary |

```
Gameplay (complete quest, miss, level up, …)
    → Events (recent buffer)
    → Lifetime stats (counters)
    → [day advances]
         → Daily Summary (UI recap — not Analytics input)
         → Daily Snapshot (immutable History record)
              → Analytics Engine (read-only stats)
                   → Analytics Dashboard + Charts
              → Hero History (Timeline / Calendar / Daily Browser)
```

**Daily Summary vs Daily Snapshot**

- Summary = presentation for the player (modal/banner). Rich copy, major events list, tomorrow preview. Only one slot persisted; full recap available when `periodKey` still matches.
- Snapshot = database row for graphs and daily browser rollups. Small, stable schema, chronological series.

Do not treat Summary as the Analytics source of truth. Do not regenerate History by replaying the capped event buffer alone.

---

# Architecture

```
src/types/history.ts              # DailySnapshot, HeroHistory
src/types/historyUi.ts            # Timeline / calendar / daily browser DTOs
src/features/history/
  historyLogic.ts                 # build / record / query snapshots
  historyTimeline.ts              # reverse-chronological feed + filters
  historyCalendar.ts              # contribution heatmap grid
  historyDaily.ts                 # daily detail builder + achievement day lookup
  historyPresentation.ts          # filter labels, heat colors
  historySample.ts                # DEV sample snapshot generator
  heroHistoryNavigation.tsx       # shared selected-day state (cross-nav)
  HeroHistoryPanel.tsx            # Dashboard section
  components/                     # Calendar, Timeline, DailyHistoryView, filters
src/store/gameStore.ts            # persists GameState.history; writes on day advance
src/dev/HistoryTestingTools.tsx   # DEV: generate / inspect / jump / reset
```

Logic stays UI-free except presentation helpers. React components **never** read `history.dailySnapshots` directly for analytics math — they call pure builders in `features/history/`.

---

# Hero History UI

## Contribution Calendar

- GitHub-style heatmap: **26 trailing weeks**, columns = weeks (Sun–Sat), rows = weekdays.
- **Color intensity** from daily completion rate (`questsCompleted / (completed + missed)`) on finalized snapshots.
- **Empty days** (no snapshot) remain visible with neutral styling.
- **Future dates** are disabled (not clickable).
- Clicking a day opens the **Daily History Browser**.

## Hero Timeline

- **Reverse chronological** feed grouped by quest-day.
- Each group shows events from the recent buffer (icons + labels via `eventLogic.ts`).
- Snapshot-only days appear under filter **All** with a placeholder when no events remain in the buffer.
- **Filters:** All, Progress, Quests, Achievements, Unlocks.
- **Search:** event title / quest name / achievement / unlock name.
- Clicking a day header or event opens the Daily History Browser.

### Supported event types

| Type | Filter | Icon |
|------|--------|------|
| `QUEST_COMPLETED` | Quests | ✅ |
| `QUEST_FAILED` | Quests | ❌ |
| `LEVEL_UP` | Progress | ⭐ |
| `STREAK_INCREASED` | Progress | 🔥 |
| `STREAK_BROKEN` | Progress | 💔 |
| `ACHIEVEMENT_UNLOCKED` | Achievements | 🏆 |
| `UNLOCK_EARNED` | Unlocks | 🔓 |

## Daily History Browser

Modal opened when a day is selected. Built by `buildDailyHistoryDetail()` from:

- **Snapshot** (when finalized): level, XP, gold, stats, streak, day deltas, achievement/unlock ids, quest counts.
- **Events** (recent buffer): named completed/missed quests, chronological event list.
- **Daily Summary** (when `dailySummary.periodKey === date`): embedded recap block.

Quest names for older days may be unavailable if events aged out of the 50-entry buffer — counts from snapshots still display.

---

# Cross-Navigation

Shared state: `HeroHistoryNavigationProvider` on the Dashboard (`selectedDate`, `openDay`, `closeDay`).

| Source | Action |
|--------|--------|
| Analytics chart point/bar | `onDaySelect(date)` → Daily History |
| Contribution calendar cell | `openDay(date)` |
| Timeline day header / event | `openDay(date)` |
| Unlocked achievement card | `findAchievementUnlockDay()` → `openDay(date)` |

Charts and Analytics Dashboard do not own navigation state — the Dashboard passes `onDaySelect` down.

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

Not stored (on purpose): full event payloads, per-quest checklists, Daily Summary copy, raw `GameEvent` arrays.

---

# Snapshot Lifecycle

1. **During the day** — events and lifetime stats update as usual. No snapshot yet for "today."
2. **When the quest day advances** — `applyPeriodResets` builds and records a snapshot (idempotent per date).
3. **Immutability** — once recorded for a date, production code never overwrites it.
4. **Simulated time** — advancing through a day boundary writes History the same way real time does. Rewinding does **not** delete snapshots.

DEV tools can force-generate today's snapshot, generate sample history, delete the latest, inspect JSON, jump to a day in the UI, or reset History only.

---

# Public API (`historyLogic.ts`)

| Function | Behavior |
|----------|----------|
| `createEmptyHistory()` | Empty document |
| `mergeHistory(persisted?)` | Safe default + chronological sort |
| `buildDailySnapshot(input)` | Pure builder |
| `recordDailySnapshot(history, snapshot)` | Append if date absent |
| `getSnapshot(date)` / `getLatestSnapshot` / `getSnapshotCount` | Queries |
| `getEventsForPeriod(events, date)` | Quest-day event slice (exported for UI) |
| `deleteLatestSnapshot` / `resetHistory` | DEV / repair helpers |

Additional builders: `buildTimelineGroups`, `buildContributionCalendar`, `buildDailyHistoryDetail`, `findAchievementUnlockDay`, `generateSampleHistory` (DEV).

---

# Extension Points (future systems)

When adding workout, nutrition, combat, or economy history:

1. Add fields to `DailySnapshot` (or new History entry types) at day finalize.
2. Extend `buildDailyHistoryDetail()` to surface them in the Daily Browser.
3. Optionally add timeline filter categories and calendar intensity rules.
4. Add Analytics series + charts — do not duplicate snapshot reads in React.

Do not expand the event buffer into unbounded storage; day rollups remain the long-term source of truth.

---

# Relationship to Analytics

The Analytics Engine reads snapshots via pure helpers. Hero History and Analytics share the same History document but serve different UX goals (exploration vs aggregates). Neither rewrites past snapshots.

Analytics should **not**:

- Scan current `QuestState[]` for historical answers.
- Treat the 50-event buffer as complete long-term history.
- Use Daily Summary as an analytics input.
