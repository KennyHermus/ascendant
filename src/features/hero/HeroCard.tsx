import { getXpProgress } from '@/features/progression/progressionLogic'
import { XpBar } from '@/components/XpBar'
import type { Hero } from '@/types/hero'

interface HeroCardProps {
  hero: Hero
  currentStreak: number
}

export function HeroCard({ hero, currentStreak }: HeroCardProps) {
  const xp = getXpProgress(hero)

  return (
    <section className="rounded-xl border border-amber-900/30 bg-stone-900/80 p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-amber-500/80">
          Path of Resolve
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-amber-50">
          {hero.name}
        </h1>
      </div>

      <XpBar
        current={xp.current}
        required={xp.required}
        percent={xp.percent}
        level={hero.level}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-amber-900/30 bg-stone-950/50 px-4 py-3">
          <dt className="text-xs text-stone-400">Gold</dt>
          <dd className="mt-1 text-xl font-semibold text-amber-300">
            {hero.currency}
          </dd>
        </div>
        <div className="rounded-lg border border-emerald-900/30 bg-stone-950/50 px-4 py-3">
          <dt className="text-xs text-stone-400">Streak</dt>
          <dd className="mt-1 text-xl font-semibold text-emerald-300">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </dd>
          <p className="mt-1 text-xs text-stone-500">
            Requires all non-negotiables today
          </p>
        </div>
      </div>
    </section>
  )
}
