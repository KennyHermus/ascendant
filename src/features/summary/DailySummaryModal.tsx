import { useEffect } from 'react'

import { ProgressBar } from '@/components/ProgressBar'
import { QUEST_CATEGORY_LABELS } from '@/data/questLabels'
import { formatEventLabel, getEventIcon } from '@/features/events/eventLogic'
import { STAT_ICONS, STAT_LABELS } from '@/features/hero/heroLogic'
import type { SummaryQuestCategoryProgress, SummarySnapshot } from '@/types/summary'

interface DailySummaryModalProps {
  summary: SummarySnapshot
  onClose: () => void
}

function QuestSummaryRow({
  label,
  progress,
}: {
  label: string
  progress: SummaryQuestCategoryProgress
}) {
  if (progress.total === 0) return null

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-stone-300">{label}</span>
        <span className="text-stone-400">
          {progress.completed} / {progress.total}
        </span>
      </div>
      <ProgressBar completed={progress.completed} total={progress.total} color="amber" label={label} />
    </div>
  )
}

/**
 * The end-of-day "rewards screen." Purely presentational — every field
 * comes from the already-computed `SummarySnapshot`; this component makes
 * no game-logic decisions of its own, and (per the generic `SummarySnapshot`
 * shape) would render a future weekly/monthly summary identically.
 */
export function DailySummaryModal({ summary, onClose }: DailySummaryModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const { quests, tomorrowPreview } = summary
  const hasTomorrowContent =
    tomorrowPreview.objectives.length > 0 ||
    tomorrowPreview.weeklyRemaining.length > 0 ||
    tomorrowPreview.closeUnlocks.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily Summary"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-amber-800/40 bg-stone-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-800/60 bg-gradient-to-b from-amber-950/40 to-transparent px-5 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">Day Complete</p>
          <h2 className="mt-1 text-xl font-semibold text-amber-50">{summary.heroName}</h2>
          <p className="text-sm text-stone-400">
            {summary.heroTitle} · Level {summary.heroLevel}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-stone-800/60 bg-stone-950/50 px-3 py-2.5">
              <dt className="text-xs text-stone-500">XP Earned</dt>
              <dd className="mt-0.5 text-lg font-semibold text-sky-300">+{summary.xpEarned}</dd>
            </div>
            <div className="rounded-lg border border-stone-800/60 bg-stone-950/50 px-3 py-2.5">
              <dt className="text-xs text-stone-500">Gold Earned</dt>
              <dd className="mt-0.5 text-lg font-semibold text-amber-300">+{summary.goldEarned}</dd>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
              Quest Summary
            </h3>
            <div className="space-y-3">
              <QuestSummaryRow label={QUEST_CATEGORY_LABELS.nonNegotiable} progress={quests.nonNegotiable} />
              <QuestSummaryRow label={QUEST_CATEGORY_LABELS.dailyBonus} progress={quests.dailyBonus} />
              <QuestSummaryRow label={QUEST_CATEGORY_LABELS.weekly} progress={quests.weekly} />
              <QuestSummaryRow label={QUEST_CATEGORY_LABELS.weeklyBonus} progress={quests.weeklyBonus} />
            </div>
          </section>

          {summary.statGrowth.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                Stat Growth
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.statGrowth.map((entry) => (
                  <span
                    key={entry.stat}
                    className="flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-3 py-1 text-sm text-emerald-300"
                  >
                    <span aria-hidden="true">{STAT_ICONS[entry.stat]}</span>
                    {STAT_LABELS[entry.stat]} +{entry.amount}
                  </span>
                ))}
              </div>
            </section>
          )}

          {summary.events.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                Major Events
              </h3>
              <ul className="space-y-2">
                {summary.events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-2 rounded-lg border border-stone-800/60 bg-stone-950/40 px-3 py-2 text-sm text-stone-200"
                  >
                    <span aria-hidden="true">{getEventIcon(event)}</span>
                    {formatEventLabel(event)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-lg border border-amber-900/30 bg-amber-950/10 px-4 py-3">
            <p className="text-sm italic text-amber-100/90">&ldquo;{summary.reflection}&rdquo;</p>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
              Tomorrow
            </h3>
            <div className="space-y-2 text-sm text-stone-300">
              <p>
                Current streak:{' '}
                <span className="font-medium text-emerald-300">
                  {tomorrowPreview.currentStreak} {tomorrowPreview.currentStreak === 1 ? 'day' : 'days'}
                </span>
              </p>
              {tomorrowPreview.objectives.length > 0 && (
                <p>
                  <span className="text-stone-400">Focus: </span>
                  {tomorrowPreview.objectives.join(', ')}
                </p>
              )}
              {tomorrowPreview.weeklyRemaining.length > 0 && (
                <p>
                  <span className="text-stone-400">Weekly still open: </span>
                  {tomorrowPreview.weeklyRemaining.join(', ')}
                </p>
              )}
              {tomorrowPreview.closeUnlocks.length > 0 && (
                <p>
                  <span className="text-stone-400">Close to unlocking: </span>
                  {tomorrowPreview.closeUnlocks.join(', ')}
                </p>
              )}
              {!hasTomorrowContent && (
                <p className="text-stone-500">Nothing pressing — a clean slate awaits.</p>
              )}
            </div>
          </section>
        </div>

        <div className="border-t border-stone-800/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md border border-amber-700/50 bg-amber-900/30 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-900/50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
