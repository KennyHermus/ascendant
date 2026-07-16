# Economy System

Version: 0.2 (aligned with Ascendant v0.0.2)

---

# Purpose

Currency provides optional rewards and motivation.

It should enhance progression without replacing real achievement.

---

# Currency

Initial currency: **Gold** (`Hero.currency`)

---

# Current Sources (v0.0.2)

Gold is earned from:

1. **Per-quest `currencyReward`** — some quests grant gold directly (see `src/data/quests.ts`)
2. **Category / subcategory completion bonuses** (`src/data/completionRewards.ts`):
   - Morning Routine / Nutrition / Evening Routine: +1 gold each
   - Weekly: +1
   - Weekly Bonus: +2
   - Special: +3
3. **Achievement rewards** — gold granted once when an achievement unlocks

Lifetime total gold earned is tracked in `Hero.lifetimeStats.totalGoldEarned` (includes quest and achievement gold).

---

# Uses

**Not implemented yet.** Designed spending targets (primarily **v0.1.x** with equipment / world systems):

## Equipment (future — v0.1.x)

Examples: Training Gloves, Scholar's Tome, Focus Charm

## Cosmetics (future)

Examples: Titles, profile backgrounds, visual effects

## Convenience (future)

Examples: Extra customization, tracking tools

---

# Avoid

Do not create systems where money replaces effort.

The player should still need to complete real actions.

---

# Equipment (future — v0.1.x)

Equipment would modify stats. Not implemented. See also `COMBAT.md` / `IMPLEMENTATION_PLAN.md` v0.1.x.

---

# Rarity (future)

Possible rarity system: Common → Mythic. Achievement rarity already exists for presentation; item rarity does not.

---

# Future Economy Features

Possible additions:

- Crafting
- Shops
- Trading
- Seasonal events

Achievement XP/Gold rewards are **already implemented**; titles/items/cosmetics from achievements remain future.
