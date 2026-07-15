import {
  LEVEL_UP_STAT_INCREASE,
  xpRequiredForLevel,
} from '@/features/progression/progressionConstants'
import { increaseAllStats } from '@/features/hero/heroLogic'
import type { Hero } from '@/types/hero'

export interface LevelUpResult {
  hero: Hero
  levelsGained: number
}

export function addXp(hero: Hero, xp: number): LevelUpResult {
  let next: Hero = { ...hero, currentXp: hero.currentXp + xp }
  let levelsGained = 0

  while (next.currentXp >= xpRequiredForLevel(next.level)) {
    next = {
      ...next,
      currentXp: next.currentXp - xpRequiredForLevel(next.level),
      level: next.level + 1,
      stats: increaseAllStats(next.stats, LEVEL_UP_STAT_INCREASE),
    }
    levelsGained++
  }

  return { hero: next, levelsGained }
}

export function getXpProgress(hero: Hero): {
  current: number
  required: number
  percent: number
} {
  const required = xpRequiredForLevel(hero.level)
  const percent = required > 0 ? Math.min(100, (hero.currentXp / required) * 100) : 0

  return {
    current: hero.currentXp,
    required,
    percent,
  }
}
