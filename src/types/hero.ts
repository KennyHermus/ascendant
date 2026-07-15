export const STAT_KEYS = [
  'strength',
  'hp',
  'defense',
  'stamina',
  'speed',
  'intellect',
  'willpower',
  'specialTechnique',
] as const

export type StatKey = (typeof STAT_KEYS)[number]

/** Per-stat state. `value` is used in v0.0.1; future stat XP fields can extend this. */
export interface StatState {
  value: number
}

export type HeroStats = Record<StatKey, StatState>

export type StatRewards = Partial<Record<StatKey, number>>

export interface Hero {
  name: string
  level: number
  currentXp: number
  currency: number
  stats: HeroStats
}
