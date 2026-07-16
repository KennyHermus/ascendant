import type { ReactNode } from 'react'

import { Panel } from '@/components/Panel'
import { XpBar } from '@/components/XpBar'
import type { NextObjective } from '@/features/dashboard/nextObjectiveLogic'
import { getHeroInitials } from '@/features/hero/heroPresentation'
import { getHeroTitle } from '@/features/hero/heroTitle'
import { getXpProgress } from '@/features/progression/progressionLogic'
import type { Hero } from '@/types/hero'

interface HeroBannerProps {
  hero: Hero
  currentStreak: number
  status: string
  nextObjective: NextObjective | null
}

function StatTile({
  label,
  value,
  valueClassName = 'text-amber-300',
  hint,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-stone-800/60 bg-stone-950/50 px-3 py-2.5">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className={`mt-0.5 text-lg font-semibold ${valueClassName}`}>{value}</dd>
      {hint && <p className="mt-0.5 text-[11px] text-stone-500">{hint}</p>}
    </div>
  )
}

/**
 * First thing the player sees. Answers "who is my hero / how strong am I /
 * how close am I to leveling / how is today going / what should I do next"
 * in one glance. The avatar circle is a reserved slot for a future hero
 * portrait — today it just shows initials.
 *
 * Visually grouped per spec: Identity (title/name/level, in the header and
 * XP bar), Progress (XP bar, Gold, Current Streak — today's numbers), and
 * Lifetime (the persistent record below — kept visually separate so it's
 * never confused with today's Current Streak).
 */
export function HeroBanner({ hero, currentStreak, status, nextObjective }: HeroBannerProps) {
  const xp = getXpProgress(hero)
  const title = getHeroTitle(hero.level)
  const initials = getHeroInitials(hero.name)
  const { lifetimeStats } = hero

  return (
    <Panel className="border-amber-900/30 bg-stone-900/80 shadow-lg shadow-black/20">
      <div className="flex items-center gap-4">
        {/* Portrait placeholder — swap for a real hero portrait/avatar later. */}
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-amber-700/50 bg-gradient-to-br from-amber-900/60 to-stone-900 text-xl font-semibold text-amber-200"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-amber-500/80">{title}</p>
          <h1 className="truncate text-2xl font-semibold text-amber-50">{hero.name}</h1>
          <p className="mt-0.5 text-sm text-stone-400">{status}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-stone-800/60 bg-stone-950/40 px-3 py-2 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Next Objective
        </span>
        {nextObjective ? (
          <span className="flex min-w-0 items-center gap-2 text-right">
            <span className="truncate text-stone-200">{nextObjective.questName}</span>
            <span className="shrink-0 text-xs text-amber-400/90">
              {nextObjective.remainingLabel ?? 'Ready'}
            </span>
          </span>
        ) : (
          <span className="text-stone-400">All caught up! 🎉</span>
        )}
      </div>

      <div className="mt-4">
        <XpBar current={xp.current} required={xp.required} percent={xp.percent} level={hero.level} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatTile label="Gold" value={hero.currency} />
        <StatTile
          label="Streak"
          value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
          valueClassName="text-emerald-300"
          hint="Requires all non-negotiables today"
        />
      </div>

      <div className="mt-4 border-t border-stone-800/60 pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Lifetime
        </p>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Quests Completed"
            value={lifetimeStats.totalQuestsCompleted}
            valueClassName="text-sky-300"
          />
          <StatTile
            label="Total XP Earned"
            value={lifetimeStats.totalXpEarned}
            valueClassName="text-sky-300"
          />
          <StatTile
            label="Total Gold Earned"
            value={lifetimeStats.totalGoldEarned}
            valueClassName="text-amber-300"
          />
          <StatTile
            label="Longest Streak"
            value={`${lifetimeStats.longestStreak} ${lifetimeStats.longestStreak === 1 ? 'day' : 'days'}`}
            valueClassName="text-emerald-300"
          />
        </div>
      </div>
    </Panel>
  )
}
