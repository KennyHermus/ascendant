import { getStatValue, STAT_LABELS } from '@/features/hero/heroLogic'
import type { HeroStats } from '@/types/hero'
import { STAT_KEYS } from '@/types/hero'

interface StatsPanelProps {
  stats: HeroStats
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <section className="rounded-xl border border-stone-700/50 bg-stone-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-400/90">
        Attributes
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_KEYS.map((key) => (
          <div
            key={key}
            className="rounded-lg border border-stone-700/40 bg-stone-950/50 px-3 py-2"
          >
            <dt className="text-xs text-stone-400">{STAT_LABELS[key]}</dt>
            <dd className="mt-0.5 text-lg font-semibold text-stone-100">
              {getStatValue(stats, key)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
