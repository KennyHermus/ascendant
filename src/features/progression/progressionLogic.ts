import { LEVEL_UP_STAT_INCREASE, xpRequiredForLevel } from '@/features/progression/progressionConstants'
import { STAT_KEYS, type Hero } from '@/types/hero'

export interface XpProgress {
  current: number
  required: number
  percent: number
}

export function getXpProgress(hero: Hero): XpProgress {
  const required = xpRequiredForLevel(hero.level)
  const percent = required > 0 ? Math.min(100, (hero.currentXp / required) * 100) : 0
  return {
    current: hero.currentXp,
    required,
    percent,
  }
}

export function addXp(
  hero: Hero,
  amount: number,
): { hero: Hero; levelsGained: number } {
  if (amount <= 0) return { hero, levelsGained: 0 }

  let currentXp = hero.currentXp + amount
  let level = hero.level
  let levelsGained = 0
  const stats = { ...hero.stats }

  while (currentXp >= xpRequiredForLevel(level)) {
    currentXp -= xpRequiredForLevel(level)
    level += 1
    levelsGained += 1
    for (const key of STAT_KEYS) {
      stats[key] = { value: stats[key].value + LEVEL_UP_STAT_INCREASE }
    }
  }

  return {
    hero: { ...hero, level, currentXp, stats },
    levelsGained,
  }
}
