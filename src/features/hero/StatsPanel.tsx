import { Panel } from '@/components/Panel'
import { getStatValue, STAT_ICONS, STAT_LABELS } from '@/features/hero/heroLogic'
import type { HeroStats } from '@/types/hero'
import { STAT_KEYS } from '@/types/hero'

interface StatsPanelProps {
  stats: HeroStats
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <Panel title="Attributes" titleClassName="text-emerald-400/90">
      <dl className="grid grid-cols-2 gap-3">
        {STAT_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-lg border border-stone-700/40 bg-stone-950/50 px-3 py-2.5"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {STAT_ICONS[key]}
            </span>
            <div className="min-w-0">
              <dt className="truncate text-xs text-stone-400">{STAT_LABELS[key]}</dt>
              <dd className="text-lg font-semibold text-stone-100">{getStatValue(stats, key)}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Panel>
  )
}
