import {
  DEFAULT_HERO_NAME,
  DEFAULT_STARTING_STAT_VALUE,
} from '@/features/progression/progressionConstants'
import type { Hero, HeroStats, StatKey, StatRewards } from '@/types/hero'
import { STAT_KEYS } from '@/types/hero'

export function createDefaultStats(): HeroStats {
  return STAT_KEYS.reduce<HeroStats>((stats, key) => {
    stats[key] = { value: DEFAULT_STARTING_STAT_VALUE }
    return stats
  }, {} as HeroStats)
}

export function createInitialHero(): Hero {
  return {
    name: DEFAULT_HERO_NAME,
    level: 1,
    currentXp: 0,
    currency: 0,
    stats: createDefaultStats(),
  }
}

export function getStatValue(stats: HeroStats, key: StatKey): number {
  return stats[key].value
}

export function applyStatRewards(
  stats: HeroStats,
  rewards: StatRewards,
): HeroStats {
  const next = { ...stats }

  for (const key of STAT_KEYS) {
    const reward = rewards[key]
    if (reward !== undefined && reward > 0) {
      next[key] = { value: stats[key].value + reward }
    }
  }

  return next
}

export function increaseAllStats(
  stats: HeroStats,
  amount: number,
): HeroStats {
  const next = { ...stats }

  for (const key of STAT_KEYS) {
    next[key] = { value: stats[key].value + amount }
  }

  return next
}

export const STAT_LABELS: Record<StatKey, string> = {
  strength: 'Strength',
  hp: 'HP',
  defense: 'Defense',
  stamina: 'Stamina',
  speed: 'Speed',
  intellect: 'Intellect',
  willpower: 'Willpower',
  specialTechnique: 'Special Technique',
}
