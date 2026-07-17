import { useEffect } from 'react'

import { ProgressBar } from '@/components/ProgressBar'
import { QUEST_CATEGORY_LABELS } from '@/data/questLabels'
import {
  formatEventLabel,
  getEventIcon,
} from '@/features/events/eventLogic'
import { STAT_ICONS, STAT_LABELS } from '@/features/hero/heroLogic'
import type { DailyHistoryDetail } from '@/types/historyUi'
import { STAT_KEYS } from '@/types/hero'

interface DailyHistoryViewProps {
  detail: DailyHistoryDetail
  onClose: () => void
}

function QuestListSection({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: string
  items: { questId: string; questName: string }[]
  emptyLabel: string
  tone: 'emerald' | 'rose'
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((quest) => (
            <li
              key={quest.questId}
              className={`rounded-md border px-3 py-2 text-sm ${
                tone === 'emerald'
                  ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-100'
                  : 'border-rose-900/40 bg-rose-950/20 text-rose-100'
              }`}
            >
              {quest.questName}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function DailyHistoryView({ detail, onClose }: DailyHistoryViewProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const { summary } = detail
  const hasSnapshot = detail.snapshot !== null
  const completionPercent =
    detail.completionRate !== null ? Math.round(detail.completionRate * 100) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`History for ${detail.dateLabel}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-violet-800/40 bg-stone-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-800/60 bg-gradient-to-b from-violet-950/40 to-transparent px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-400/80">
            Hero History
          </p>
          <h2 className="mt-1 text-xl font-semibold text-violet-50">{detail.dateLabel}</h2>
          <p className="text-sm text-stone-400">
            {detail.isFuture
              ? 'Future date'
              : detail.isToday
                ? 'Today (in progress — snapshot at day end)'
                : hasSnapshot
                  ? 'Finalized day record'
                  : 'Partial record from recent events'}
          </p>

          {hasSnapshot && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Level" value={String(detail.level ?? '—')} />
              <Metric label="XP (day)" value={`+${detail.xpEarned ?? 0}`} accent="sky" />
              <Metric label="Gold (day)" value={`+${detail.goldEarned ?? 0}`} accent="amber" />
              <Metric
                label="Streak"
                value={detail.currentStreak !== null ? `${detail.currentStreak}d` : '—'}
                accent="emerald"
              />
            </div>
          )}
        </div>

        <div className="space-y-5 px-5 py-5">
          {!hasSnapshot && !detail.isFuture && (
            <p className="rounded-lg border border-dashed border-stone-700/50 px-3 py-2 text-sm text-stone-400">
              No finalized snapshot for this day. Showing whatever is still in the
              recent event buffer.
            </p>
          )}

          {hasSnapshot && detail.stats && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                End-of-Day Stats
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {STAT_KEYS.map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-md border border-stone-800/60 bg-stone-950/40 px-2.5 py-2 text-sm"
                  >
                    <span aria-hidden="true">{STAT_ICONS[key]}</span>
                    <span className="text-stone-400">{STAT_LABELS[key]}</span>
                    <span className="ml-auto font-medium text-stone-200">
                      {detail.stats![key]}
                    </span>
                  </div>
                ))}
              </div>
              {(detail.gold !== null || detail.currentXp !== null) && (
                <p className="mt-2 text-xs text-stone-500">
                  Wallet: {detail.gold ?? '—'} gold · {detail.currentXp ?? '—'} XP in level
                </p>
              )}
            </section>
          )}

          {(detail.questsCompleted > 0 || detail.questsMissed > 0 || completionPercent !== null) && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                Quest Activity
              </h3>
              {completionPercent !== null && (
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-stone-500">
                    <span>Completion</span>
                    <span>{completionPercent}%</span>
                  </div>
                  <ProgressBar
                    completed={detail.questsCompleted}
                    total={detail.questsCompleted + detail.questsMissed}
                    color="emerald"
                    label="Day completion"
                  />
                </div>
              )}
              <p className="text-sm text-stone-400">
                {detail.questsCompleted} completed · {detail.questsMissed} missed
              </p>
            </section>
          )}

          <QuestListSection
            title="Completed Quests"
            items={detail.completedQuests}
            emptyLabel={
              detail.questsCompleted > 0
                ? `${detail.questsCompleted} completed — names not in event buffer`
                : 'None recorded'
            }
            tone="emerald"
          />

          <QuestListSection
            title="Missed Quests"
            items={detail.missedQuests}
            emptyLabel={
              detail.questsMissed > 0
                ? `${detail.questsMissed} missed — names not in event buffer`
                : 'None recorded'
            }
            tone="rose"
          />

          {detail.achievements.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                Achievements Earned
              </h3>
              <ul className="space-y-1.5">
                {detail.achievements.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-2 rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-100"
                  >
                    <span aria-hidden="true">{entry.icon ?? '🏆'}</span>
                    {entry.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {detail.unlocks.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                Unlocks Earned
              </h3>
              <ul className="space-y-1.5">
                {detail.unlocks.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-2 rounded-md border border-sky-900/40 bg-sky-950/20 px-3 py-2 text-sm text-sky-100"
                  >
                    <span aria-hidden="true">🔓</span>
                    {entry.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {detail.events.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                Events
              </h3>
              <ul className="space-y-2">
                {detail.events.map((event) => (
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

          {summary && (
            <section className="rounded-lg border border-amber-900/30 bg-amber-950/10 px-4 py-3">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                Daily Summary
              </h3>
              <p className="text-sm text-stone-300">
                {summary.heroTitle} · Level {summary.heroLevel} · +{summary.xpEarned} XP · +
                {summary.goldEarned} gold
              </p>
              <div className="mt-3 space-y-2">
                {(Object.keys(summary.quests) as (keyof typeof summary.quests)[]).map(
                  (key) => {
                    const progress = summary.quests[key]
                    if (progress.total === 0) return null
                    return (
                      <div key={key} className="text-xs text-stone-400">
                        {QUEST_CATEGORY_LABELS[key]}: {progress.completed}/{progress.total}
                      </div>
                    )
                  },
                )}
              </div>
              <p className="mt-3 text-sm italic text-amber-100/90">
                &ldquo;{summary.reflection}&rdquo;
              </p>
            </section>
          )}
        </div>

        <div className="border-t border-stone-800/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md border border-violet-700/50 bg-violet-900/30 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-900/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  accent = 'stone',
}: {
  label: string
  value: string
  accent?: 'stone' | 'sky' | 'amber' | 'emerald'
}) {
  const valueClass =
    accent === 'sky'
      ? 'text-sky-300'
      : accent === 'amber'
        ? 'text-amber-300'
        : accent === 'emerald'
          ? 'text-emerald-300'
          : 'text-stone-200'

  return (
    <div className="rounded-lg border border-stone-800/60 bg-stone-950/50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className={`mt-0.5 text-lg font-semibold ${valueClass}`}>{value}</dd>
    </div>
  )
}
