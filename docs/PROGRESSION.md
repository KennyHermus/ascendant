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

Initial formula:

XP Required = Level × Level × 100



Example:

Level 1 → 2

100 XP

Level 5 → 6

2500 XP

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

## Future Formula

Multiplier =  
1 + (Streak Length × 0.01)



Example:

30 day streak:

1.30x reward multiplier

---

# Category Completion Rewards (v0.0.1)

Bonuses granted once when all quests in a category are completed for the period.

Defined in `src/data/completionRewards.ts`:

| Category | XP | Gold |
|----------|-----|------|
| Daily Core | +3 | +1 |
| Weekly | +3 | +1 |
| Weekly Bonus | +5 | +2 |
| Special | +7 | +3 |

Daily Bonus completion reward is TBD and not yet implemented.

Claims reset daily (daily core) or weekly (weekly, weekly bonus). Special claims persist until reset progress.

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