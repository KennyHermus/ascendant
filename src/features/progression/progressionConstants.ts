/** XP required to reach the next level: level × level × 100 */
export function xpRequiredForLevel(level: number): number {
  return level * level * 100
}

export const DEFAULT_HERO_NAME = 'Unnamed Ascendant'

export const DEFAULT_STARTING_STAT_VALUE = 1

export const LEVEL_UP_STAT_INCREASE = 1
