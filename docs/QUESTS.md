# Quest System

Version: 0.2 (aligned with Ascendant v0.0.2)

---

# Purpose

Quests represent real-life actions.

A quest is an action that improves the player.

---

# Current Categories (v0.0.2)

| Category | Role |
|----------|------|
| **Non-Negotiables** | Required for the streak. Split into subcategories. |
| **Daily Bonus** | Optional daily growth. Never affects streak. |
| **Weekly** | Weekly maintenance. |
| **Weekly Bonus** | Extra weekly quests. |
| **Special** | Future / empty today. |

## Non-Negotiables

### Morning Routine

- Wake Up *(weekdays only, timed)*
- Morning Walk
- Core
- Workout
- Rehab

### Nutrition

- Breakfast *(optional — never required for streak/subcategory bonus)*
- Lunch
- Dinner
- Vitamins + Protein

### Evening Routine

- Learning / Work *(on weekends: shown under Daily Bonus, does not count toward streak)*
- Evening Walk
- Sleep *(weekdays only, timed)*

## Daily Bonus

Finance, Duolingo, Trash, Dishes, Bible, Read, Journal, Call Family.

## Weekly

Cooking, Groceries, Cleaning, Grooming.

## Weekly Bonus

Laundry, Vacuum, Social, Call Family/Friends.

## Special

Empty and future-ready (personal records, major milestones, etc.).

---

# Quest Model

```
QuestDefinition {
  id
  name
  description
  category            // nonNegotiable | dailyBonus | weekly | weeklyBonus | special
  subcategory?        // morningRoutine | nutrition | eveningRoutine
  xpReward
  currencyReward
  statRewards
  optional?           // completable but excluded from streak / group rewards
  contributesToStreak
  schedule? {
    weekdaysOnly?           // hidden on weekends
    streakOnlyOnWeekdays?   // still shown; stops counting toward streak on weekends
  }
  timing? {
    targetTime              // HH:mm local
    graceMinutes
  }
}

QuestState {
  id
  status                // available | completed | missed
}
```

There is no separate hardcoded "required quests" list. The required set for a day is derived from quest data (`category`, `optional`, `schedule`) via `questSchedule.ts` and `getNonNegotiableCompletionStatus()` in `questLogic.ts`.

---

# Streak Contribution

The streak increases only when **every Non-Negotiable quest required today** is completed.

- Weekdays: includes Wake Up, Learning/Work, Sleep (among other required Non-Negotiables).
- Weekends: Wake Up and Sleep do not appear; Learning/Work becomes Daily Bonus for streak purposes.
- Breakfast is always optional and never required.
- Daily Bonus, Weekly, Weekly Bonus, and Special never affect the streak.

Optional quests do not break or satisfy streak requirements.

If a day ends without completing its required Non-Negotiables, the streak resets to **0 immediately** at that day's end deadline (Sleep's grace period when Sleep is required; otherwise midnight) — it does not stay elevated until the next successful day.

---

# Timed Quests

A quest may optionally declare `timing`:

- `targetTime` (HH:mm, local)
- `graceMinutes`

Status is independent of timing phase:

| Status | Meaning |
|--------|---------|
| Available | Can still be completed (before deadline) |
| Completed | Rewards granted |
| Missed | Past deadline; cannot complete; no rewards |

Timing phases (display/urgency only): On Time → In Grace Period → Expired.

**Current availability is never read from events.** `QUEST_FAILED` (missed) events are immutable history for Recent Progress / Daily Summary / future Analytics. Availability is always recalculated from quest definition + current application time + completion state. Rewinding simulated time before a deadline restores Available even if a miss event for that window remains in history. Re-entering the same missed window does not emit a duplicate `QUEST_FAILED` (deduped by quest id + quest-day `periodKey`).

If local time is past `targetTime + graceMinutes` and status is still Available, the quest becomes Missed. Before that deadline the quest stays Available and completable. Evaluated on app load, refresh, tab resume, and every simulated-time change — never on a background timer.

Grace windows that cross midnight (Sleep 23:45 + 30m → 00:15) keep evaluating against the prior night until the deadline. The daily quest-day boundary uses that same deadline (not calendar midnight), so 00:00–00:15 still belongs to the night that just ended.

### Current timed quests

- **Wake Up** — weekdays only, 6:45 AM, 30-minute grace
- **Sleep** — weekdays only, 11:45 PM, 30-minute grace

Meals are not timed in the current data.

### Developer time simulation

`src/lib/gameTime.ts` → `getCurrentGameTime()`. Dev tools can toggle simulated time, set a custom date/time, advance (+15m / +30m / +1h / +6h / +1d), or reset to real time. Simulated time persists in save state when enabled. Time changes re-run `applyPeriodResets()` + `evaluateTimedQuests()`.

---

# Unlocks

Unlocks are a **separate domain** from quests. Entertainment is not forbidden — it is unlocked after proving discipline that day.

```
UnlockRequirement =
  | { type: 'questCompletion', questId: string }
  | { type: 'groupCompletion', group: CompletionRewardKey }

UnlockDefinition {
  id, name, description, target, requirements[]
}
```

### Current unlocks

| Unlock | Requirement |
|--------|-------------|
| Messages | Morning Walk + Core complete |
| YouTube | Rehab complete |
| Gaming | Learning / Work complete |
| Social Media | Workout complete |
| Netflix | All Morning Routine Non-Negotiables complete |

Unlocks are **recomputed** from current quest state (not permanent claim-once). After daily reset, they re-lock until requirements are met again.

Persisted in `GameState.unlocks`; old saves default safely to locked and recompute on rehydrate.

---

# Philosophy

Quests should improve:

Body · Mind · Character · Environment · Relationships · Skills

Entertainment is unlocked, not banned.

---

# Historical Notes

- v0.0.1 used a `dailyCore` / boolean `completed` model and looser timed targets (7:00 AM / midnight). Those are superseded by this document.
- Early prose sometimes said "Daily Quests" or "growth quests" — current names are **Non-Negotiables** and **Daily Bonus**.
