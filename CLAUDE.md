# Ascendant AI Context

Ascendant is a personal development RPG.

The player improves their real life and their character simultaneously.

**Current version:** v0.0.2  
**Next milestone:** v0.0.3 — History & Analytics

---

# Identity

The player begins as a weak hero.

Through discipline and consistency they gain:

- Experience
- Stats
- Achievements
- Unlocks
- Knowledge

(Future: Skills, Equipment, Abilities, Combat, Story / World — **v0.1.x only**.)

Eventually they overcome increasingly difficult challenges.

---

# Implemented Systems (v0.0.2)

## Hero

- Level, XP, gold
- Eight flat stats (Strength, HP, Defense, Stamina, Speed, Intellect, Willpower, Special Technique)
- Level-based title ladder
- Lifetime stats (longest streak, total quests, total XP/gold, per-quest completion counts)
- Dynamic status + Next Objective on the Hero Banner

## Quests

Real-world actions organized as:

- Non-Negotiables (Morning Routine, Nutrition, Evening Routine)
- Daily Bonus
- Weekly / Weekly Bonus
- Special (empty, future-ready)

Support optional quests, timed quests, weekday schedules, and streak contribution flags.

## Progression

- Hero XP + level-ups (all stats +1 on level)
- Direct stat rewards from quests
- Category / subcategory completion bonuses
- Streaks (required Non-Negotiables only)
- Achievements (consume state; grant XP/gold once)
- Daily Summary (end-of-day recap)

## Unlocks

In-game permission system for less productive activities (Messages, YouTube, Gaming, Social Media, Netflix). Recomputed from quest state daily — not permanent.

## Events

Lightweight `GameEvent` log powers Recent Progress and Daily Summary. Foundation for v0.0.3 History & Analytics — not a full history UI yet.

---

# Major Systems (aspirational)

Skills, Equipment, Combat, Story, Inventory — designed in docs but **not implemented**. Do not invent them when coding unless the current milestone asks for them.

---

# Philosophy

Ascendant should feel like:

- An RPG
- A personal challenge
- A journey

Not:

- A spreadsheet
- A punishment system
- A productivity tracker
