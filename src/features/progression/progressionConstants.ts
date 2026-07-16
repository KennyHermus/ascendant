/**
 * XP required to reach the next level: level × level × 300.
 *
 * The v0.0.2 Non-Negotiables restructure roughly tripled achievable daily
 * XP (11 non-negotiables + 8 daily bonus quests + 3 subcategory bonuses,
 * vs. the original 6 + 3 + 1), so the coefficient was scaled from 100 to
 * 300 to keep time-to-level similar.
 */
export function xpRequiredForLevel(level: number): number {
  return level * level * 300
}

export const DEFAULT_HERO_NAME = 'Unnamed Ascendant'

export const DEFAULT_STARTING_STAT_VALUE = 1

export const LEVEL_UP_STAT_INCREASE = 1
