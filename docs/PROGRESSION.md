# Progression System

Version: 0.1

---

# Overview

Ascendant has multiple progression layers.

The player improves through:

1. Hero Level

2. Individual Stats

3. Skills

4. Abilities

5. Equipment

---

# Hero Level

Hero level represents overall progression.

Starting:

Level 1

Each level:

- Increases all stats slightly

- Unlocks new content

- Enables stronger challenges

---

# Experience

XP sources:

## Daily Quest

Base:

1 XP

---

## Daily Bonus

Base:

2 XP

---

## Daily Completion

Base:

3 XP

---

## Weekly Quest

Base:

3 XP

---

## Weekly Bonus

Base:

5 XP

---

## Special Quest

Base:

7 XP

---

# XP Curve

Early levels should feel achievable.

Later levels require increasing commitment.

Initial formula (v0.0.1–v0.0.2):

XP Required = Level × Level × 100

## v0.0.2 Update (Non-Negotiables restructure)

The Non-Negotiables quest expansion (split into 3 subcategories, 8 new Daily Bonus quests, 3 subcategory completion bonuses replacing the single Daily Core bonus) roughly triples achievable daily XP. The coefficient was scaled up to keep time-to-level similar:

XP Required = Level × Level × 300

Example:

Level 1 → 2

300 XP

Level 5 → 6

7500 XP

---

# Stat Experience

Stats have independent growth.

Example:

Workout:

Hero XP

+

Strength XP

+

Stamina XP

---

# Starting Stats

Strength: 1

HP: 1

Defense: 1

Stamina: 1

Speed: 1

Intellect: 1

Willpower: 1

Special Technique: 1

---

# Streak System

Consistency provides bonuses.

## v0.0.1 Behavior

The streak increases only when **all daily core quests** are completed for the day.

- Daily core quests use the `daily` category.
- Daily bonus quests are tracked separately and do not affect streak.
- Weekly and special quests do not affect streak.
- Streak display is informational in v0.0.1; reward multipliers are not yet applied.

## v0.0.2 Update (Non-Negotiables restructure)

`dailyCore` was replaced by `nonNegotiable`. The streak now increases only when **every non-negotiable quest required today** is completed — the required set is weekday/weekend-aware and derived from quest data (`contributesToStreak`, `optional`, `schedule`), not a hardcoded list:

- Weekdays: 11 required quests (includes Wake Up, Learning/Work, Sleep).
- Weekends: 8 required quests (Wake Up and Sleep don't appear at all; Learning/Work becomes an ordinary Daily Bonus quest and doesn't count).
- Breakfast is always optional and never required.
- Daily Bonus, Weekly, Weekly Bonus, and Special quests never affect the streak, on any day.

## Future Formula

Multiplier =  
1 + (Streak Length × 0.01)



Example:

30 day streak:

1.30x reward multiplier

---

# Category Completion Rewards

Bonuses granted once when all required quests in a group are completed for the period.

Defined in `src/data/completionRewards.ts`.

## v0.0.1

| Category | XP | Gold |
|----------|-----|------|
| Daily Core | +3 | +1 |
| Weekly | +3 | +1 |
| Weekly Bonus | +5 | +2 |
| Special | +7 | +3 |

## v0.0.2 Update (Non-Negotiables restructure)

The single Daily Core bonus was replaced by three subcategory bonuses, weighted by importance/effort. Weekly Bonus is unchanged; a new Weekly Bonus category (Laundry, Vacuum, Social, Call Family/Friends) reuses the existing bonus tier:

| Group | XP | Gold |
|-------|-----|------|
| Morning Routine | +2 | +1 |
| Nutrition | +2 | +1 |
| Evening Routine | +3 | +1 |
| Weekly | +3 | +1 |
| Weekly Bonus | +5 | +2 |
| Special | +7 | +3 |

Daily Bonus completion reward is still TBD and not implemented.

Claims reset daily (Morning Routine, Nutrition, Evening Routine) or weekly (Weekly, Weekly Bonus). Special claims persist until reset progress.

A Missed timed quest (see `QUESTS.md` — Timed Quests) counts against completion the same as an incomplete quest: it blocks its group's `allComplete` state, so a missed Wake Up or Sleep also blocks the streak and that subcategory's completion bonus for the day. This is intentional — it reflects the "Consistency > Intensity" philosophy without adding a separate penalty. Optional quests (Breakfast) and quests suspended for the day (Learning/Work on weekends) are excluded from their group's required count entirely, so they can never block it.

---

# Currency

Currency represents game rewards.

Used for:

- Equipment

- Cosmetics

- Unlocks

- Special items

Initial rewards:

Daily completion:

$1

Weekly:

$1

Weekly bonus:

$2

Special:

$3

---

# Level Milestones

Every level:

- Stat increases

- New challenges

Every 5 levels:

- Elite challenge

- Special reward

Every 10 levels:

- Boss fight

- Rare reward

- Major story event

---

# Recovery System

If the player fails a challenge:

They receive:

- Recovery quests

- Comeback opportunities

- Reduced penalties

The objective:

Return stronger.