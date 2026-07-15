import { getXpProgress } from '@/features/progression/progressionLogic'
import { XpBar } from '@/components/XpBar'
import type { Hero } from '@/types/hero'

interface HeroCardProps {
  hero: Hero
}

export function HeroCard({ hero }: HeroCardProps) {
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
    </section>
  )
}
