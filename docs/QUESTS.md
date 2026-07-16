# Quest System

Version: 0.1

---

# Purpose

Quests represent real-life actions.

A quest is:

An action that improves the player.

---

# Quest Categories

## Daily Quests

Completed every day.

Examples:

- Wake up on time

- Workout

- Rehab

- Walk

- Core work

- Reading

---

## Daily Unlock Quests

These control access to distractions.

The player earns the ability to use entertainment.

Examples:

Before:

- YouTube

- Gaming

- Social media

- Messages

After:

- Required quests completed

---

# Unlock Philosophy

Entertainment is not forbidden.

It is unlocked.

The player proves discipline before accessing rewards.

---

# Example Unlock Chain

## Messages

Requirement:

Complete:

- Core

- Rehab

- Walk

Restriction:

Do Not Disturb active during:

- Work hours

- Until noon on weekends

---

## YouTube

Requirement:

Workout complete

---

## Gaming

Requirement:

Learning or Work complete

---

## Social Media

Requirement:

Duolingo complete

---

## Netflix

Requirement:

All daily core quests complete

---

# Timed Quests

Certain quests have deadlines.

Examples:

Wake Up:

Target:

Before 7:00 AM

Sleep:

Target:

Before midnight

Meals:

Within one hour of planned meal time

---

# Grace Periods

Life is unpredictable.

Timed quests may include:

- Small buffer windows

- Emergency rescheduling

However:

Repeated rescheduling reduces discipline.

---

# Quest Types

## Core

Essential daily improvement.

Reward:

Small XP

---

## Bonus

Optional growth quests.

Examples:

- Bible reading

- Journal

- Extra learning

Reward:

Higher XP

---

## Weekly

Maintenance quests.

Examples:

- Cooking

- Grocery shopping

- Cleaning

- Grooming

- Laundry

---

## Special

Rare achievements.

Examples:

- Personal records

- Major goals

- Milestones

---

# Initial Quest Template

Quest {  
id  
name  
category  
description  
frequency  
deadline  
xpReward  
currencyReward  
statRewards  
completed  
}

---

# Timed Quests (v0.0.2)

A quest may optionally declare `timing`:

Quest.timing {  
targetTime (HH:mm, local time)  
graceMinutes  
}

Quest completion state is a status, not a boolean:

Quest status:

- Available
- Completed
- Missed

Timed quests additionally expose a timing phase, evaluated independently of status:

- On Time
- In Grace Period
- Expired

Grace Period is a timing window, not a completion state — it never appears as a quest status.

If the local time is past `targetTime + graceMinutes` and the quest is still Available, it automatically becomes Missed. Missed quests cannot be completed, grant no rewards, and cause no penalties.

Timing is evaluated on app load, refresh, and tab resume — never on a background timer.

Initial timed quests:

- Wake Up — 7:00 AM, 30-minute grace
- Sleep — 12:00 AM (midnight), 15-minute grace

All other quests remain untimed.

---

# Quest Categories (v0.0.2 — Non-Negotiables restructure)

The daily categories were restructured into a more intentional life system. `dailyCore` was replaced by `nonNegotiable`, split into three subcategories, and a `weeklyBonus` category was introduced:

- **Non-Negotiables** — determine the streak. Split into subcategories:
  - **Morning Routine**: Wake Up, Morning Walk, Core, Workout, Rehab
  - **Nutrition**: Breakfast (optional), Lunch, Dinner, Vitamins + Protein
  - **Evening Routine**: Learning/Work, Evening Walk, Sleep
- **Daily Bonus** — never affects the streak. Finance, Duolingo, Trash, Dishes, Bible, Read, Journal, Call Family.
- **Weekly** — Cooking, Groceries, Cleaning, Grooming.
- **Weekly Bonus** (new) — Laundry, Vacuum, Social, Call Family/Friends.
- **Special** — unchanged, still empty and future-ready.

## Quest Model Additions

```
QuestDefinition {
  ...
  subcategory?: 'morningRoutine' | 'nutrition' | 'eveningRoutine'
  schedule?: {
    weekdaysOnly?: boolean          // hidden entirely on weekends
    streakOnlyOnWeekdays?: boolean  // still shown, but stops counting toward streak on weekends
  }
  contributesToStreak: boolean
  optional?: boolean                 // completable, but excluded from streak/subcategory rewards
}
```

There is no separate hardcoded "required quests" list anywhere in the codebase. The required set for a given day is always derived from the quest data itself (`category`, `optional`, `schedule`) — see `questSchedule.ts` and `getNonNegotiableCompletionStatus()` in `questLogic.ts`.

## Weekday / Weekend Behavior

- **Wake Up** and **Sleep** (`schedule.weekdaysOnly`) do not appear at all on weekends — not shown, not required, not completable.
- **Learning/Work** (`schedule.streakOnlyOnWeekdays`) still appears and is completable every day, but on weekends it is displayed under Daily Bonus and does not count toward the streak or the Evening Routine subcategory bonus.
- **Breakfast** (`optional: true`) is completable every day for its own small reward, but never required for the streak or the Nutrition subcategory bonus.
- All other non-negotiables (Morning Walk, Core, Workout, Rehab, Lunch, Dinner, Vitamins + Protein, Evening Walk) are required every day, weekday or weekend.

This resolves an internal inconsistency in the original request: the streak rules bullet list included "Sleep" under weekend requirements while the surrounding prose explicitly said Sleep should not affect weekend requirements, and separately omitted Morning Walk / Vitamins + Protein from both lists despite no stated weekday-only intent. The data-driven `schedule` field is the single source of truth going forward, so this kind of drift can't recur.

## Timed Quests (v0.0.2 update)

- **Wake Up**: weekdays only, target 6:45 AM, 30-minute grace.
- **Sleep**: weekdays only, target 11:45 PM, 30-minute grace.

(The original v0.0.2 targets of 7:00 AM / midnight were replaced by the above.)

## Developer Time Simulation

`src/lib/gameTime.ts` centralizes all "current time" access via `getCurrentGameTime()`. A developer-only override lets `src/dev/DevTools.tsx` fast-forward time (toggle, set custom date/time, +15m/+30m/+1h/+6h/+1d, reset to real time) to test streaks, resets, and timed quests without waiting. Every time-adjustment action re-runs the normal load/resume evaluation pipeline (`applyPeriodResets()` + `evaluateTimedQuests()`) — there is still no background timer anywhere in the app.

---

# Initial Philosophy

Quests should improve:

Body

Mind

Character

Environment

Relationships

Skills

---

# v0.0.1 Streak Qualification

In v0.0.1, the streak increases only when **all daily core quests** (`daily` category) are completed for the day.

- Daily bonus quests are tracked separately and do not affect streak.
- Weekly and special quests do not affect streak.
- Completing individual core quests before the full set is done does not advance the streak.