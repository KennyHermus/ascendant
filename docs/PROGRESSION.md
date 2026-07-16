# Progression System

Version: 0.2 (aligned with Ascendant v0.0.2)

---

# Overview

The player improves through:

1. **Hero Level** (overall XP)
2. **Individual Stats** (direct value increases from quest rewards)
3. **Streaks** (consistency with required Non-Negotiables)
4. **Lifetime statistics** (long-term counters)
5. **Achievements** (milestones; grant XP/gold once)

Future layers (**v0.1.x only**, not implemented): Skills, Abilities, Equipment, Combat milestones.

---

# Hero Level

Starting level: **1**

On level-up:

- Level +1
- All eight base stats +1
- XP remainder carries over

Unlocks of future content / stronger challenges are design goals; combat milestones are not implemented yet.

---

# Experience

## Sources (current)

XP comes from:

- **Per-quest `xpReward`** — defined per quest in `src/data/quests.ts` (typically 1–4 XP; values vary by quest)
- **Category / subcategory completion bonuses** — see table below (`src/data/completionRewards.ts`)
- **Achievement rewards** — XP granted once when an achievement unlocks

There is no flat "all Daily Quests give 1 XP" rule anymore — use the data file as source of truth.

## XP Curve

```
XP Required = Level × Level × 300
```

Example: Level 1 → 2 needs 300 XP; Level 5 → 6 needs 7500 XP.

(Raised from ×100 in early v0.0.1 to keep pace after the Non-Negotiables expansion.)

---

# Stats

Eight stats: Strength, HP, Defense, Stamina, Speed, Intellect, Willpower, Special Technique.

Starting value: **1** each.

### How stats grow today

Quest `statRewards` (and level-up) **increment `stats[key].value` directly**. There is no separate "Strength XP" pool yet — `StatState` is structured so a future stat-XP system can be added without rewriting the hero model.

---

# Streak System

Consistency is the focus. Streak display is informational today; reward multipliers are **not** applied yet.

### Current rules (v0.0.2)

Streak increases only when **every Non-Negotiable quest required today** is completed.

- Required set is weekday/weekend-aware (`contributesToStreak`, `optional`, `schedule`) — not a hardcoded ID list.
- Weekdays: includes Wake Up, Learning/Work, Sleep among required Non-Negotiables.
- Weekends: Wake Up/Sleep absent; Learning/Work does not count toward streak.
- Breakfast is always optional.
- Daily Bonus / Weekly / Weekly Bonus / Special never affect streak.
- A Missed timed quest blocks that day's streak and its subcategory completion bonus.

**Immediate break:** if the day *after* the last successful Non-Negotiable day ends without being completed, `currentStreak` resets to **0** right away (does not wait until the next successful day restarts at 1). Day end is the latest grace deadline among timed streak quests required that day (Sleep on weekdays: 23:45 + 30m → 00:15 next morning); otherwise midnight. Reconciled on load/resume, timed-quest evaluation, period resets, and quest completion.

### Future (not implemented)

```
Multiplier = 1 + (Streak Length × 0.01)
```

---

# Category Completion Rewards

Granted **once** when all required quests in a group are completed for the period. Defined in `src/data/completionRewards.ts`.

| Group | XP | Gold | Reset |
|-------|-----|------|-------|
| Morning Routine | +2 | +1 | Daily |
| Nutrition | +2 | +1 | Daily |
| Evening Routine | +3 | +1 | Daily |
| Weekly | +3 | +1 | Weekly |
| Weekly Bonus | +5 | +2 | Weekly |
| Special | +7 | +3 | Persists until full reset |

Daily Bonus completion reward: TBD / not implemented.

Optional quests and day-suspended quests are excluded from the required count.

---

# Lifetime Progression

Persisted on `Hero.lifetimeStats` (incremental updates, never scanned from history):

- `longestStreak`
- `totalQuestsCompleted`
- `totalXpEarned`
- `totalGoldEarned`
- `questCompletionCounts` — per quest id (powers count-based Achievements)

---

# Achievements

Data-driven milestones in `src/features/achievements/`. They **consume** hero/quest/lifetime state and events; they do not change quest or streak rules.

- Categories: Progression, Consistency, Quests, Exploration, Fitness, Learning, Special
- Rarity → Achievement Points (separate from XP)
- Rewards today: XP and Gold (other reward types modelled for later)
- Unlock once; persisted with `unlockedAt`

See `docs/ARCHITECTURE.md` — Achievements section.

---

# Currency

Gold is earned from quests, completion bonuses, and achievements.

Spending (equipment, cosmetics, shops) remains future — see `ECONOMY.md`.

---

# Level Milestones (future)

Every level: stat increases; future content unlocks.

Every 5 / 10 levels: elite challenges, boss fights, story events — **not implemented**.

---

# Recovery System (future)

Failure should create recovery quests and comeback opportunities — designed in GAME_BIBLE, not implemented.

---

# Historical Notes

- v0.0.1 streak used `dailyCore` / `daily` naming — superseded by Non-Negotiables.
- Early docs listed flat category XP bases (1 / 2 / 3…) — superseded by per-quest rewards + completion table above.
