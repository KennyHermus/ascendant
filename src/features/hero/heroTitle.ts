/**
 * Hero Title system — for now, titles are determined purely by level. Kept
 * in its own file (rather than folded into `heroPresentation.ts`) since
 * this is meant to grow into a small standalone system: a future title
 * resolver could consult story progression, achievements, transformations,
 * or prestige state without any Dashboard component needing to change —
 * they'd still just call `getHeroTitle()`.
 */

const HERO_LEVEL_TITLES: readonly { minLevel: number; title: string }[] = [
  { minLevel: 1, title: 'Novice' },
  { minLevel: 5, title: 'Apprentice' },
  { minLevel: 10, title: 'Adventurer' },
  { minLevel: 20, title: 'Veteran' },
  { minLevel: 35, title: 'Elite' },
  { minLevel: 50, title: 'Champion' },
  { minLevel: 75, title: 'Ascendant' },
  { minLevel: 100, title: 'Legend' },
]

/** Level-based title ladder. A level-1 hero reads "Novice". */
export function getHeroTitle(level: number): string {
  let title = HERO_LEVEL_TITLES[0].title
  for (const tier of HERO_LEVEL_TITLES) {
    if (level >= tier.minLevel) title = tier.title
  }
  return title
}
