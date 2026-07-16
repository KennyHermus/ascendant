interface DailySummaryBannerProps {
  onView: () => void
  /** Whether `dailySummary` covers a day before today (i.e. it's being shown post-midnight, per spec). */
  isPreviousDay: boolean
  /** Whether the player has already opened this summary at least once. */
  viewed: boolean
}

/**
 * Dashboard call-to-action for the current `dailySummary`. Stays visible —
 * and re-clickable — for as long as `isDailySummaryDisplayable()` says so
 * (see `dailySummaryLogic.ts`), regardless of `viewed`: closing the summary
 * doesn't dismiss this banner, only the noon-next-day time window does.
 * `viewed` only softens the copy so a re-check doesn't read like a fresh
 * notification every time.
 */
export function DailySummaryBanner({ onView, isPreviousDay, viewed }: DailySummaryBannerProps) {
  const dayLabel = isPreviousDay ? "Yesterday's" : "Today's"

  return (
    <button
      type="button"
      onClick={onView}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-amber-700/40 bg-gradient-to-r from-amber-950/50 to-stone-900/60 p-4 text-left transition hover:border-amber-600/60 hover:from-amber-950/70"
    >
      <div>
        <p className="text-sm font-semibold text-amber-200">
          {viewed ? `View ${dayLabel} Summary` : `${dayLabel} Summary is ready`}
        </p>
        <p className="mt-0.5 text-xs text-stone-400">See how the day went and what's ahead.</p>
      </div>
      <span aria-hidden="true" className="text-2xl">
        📜
      </span>
    </button>
  )
}
