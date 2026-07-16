import type { QuestProgressSummary } from '@/features/quests/questLogic'

interface ProgressSummaryProps {
  progress: QuestProgressSummary
}

function CompletionBadge({
  label,
  completed,
  total,
  allComplete,
}: {
  label: string
  completed: number
  total: number
  allComplete: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        allComplete
          ? 'border-emerald-900/40 bg-emerald-950/30'
          : 'border-stone-700/40 bg-stone-950/50'
      }`}
    >
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd
        className={`mt-1 text-xl font-semibold ${
          allComplete ? 'text-emerald-300' : 'text-stone-200'
        }`}
      >
        {completed} / {total}
      </dd>
    </div>
  )
}

export function ProgressSummary({ progress }: ProgressSummaryProps) {
  const { morningRoutine, nutrition, eveningRoutine, dailyBonus } = progress

  return (
    <section className="rounded-xl border border-stone-700/50 bg-stone-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-400/90">
        Today's Progress
      </h2>
      <dl className="grid grid-cols-2 gap-4">
        <CompletionBadge
          label="Morning Routine"
          completed={morningRoutine.completed}
          total={morningRoutine.total}
          allComplete={morningRoutine.allComplete}
        />
        <CompletionBadge
          label="Nutrition"
          completed={nutrition.completed}
          total={nutrition.total}
          allComplete={nutrition.allComplete}
        />
        <CompletionBadge
          label="Evening Routine"
          completed={eveningRoutine.completed}
          total={eveningRoutine.total}
          allComplete={eveningRoutine.allComplete}
        />
        <CompletionBadge
          label="Daily Bonus"
          completed={dailyBonus.completed}
          total={dailyBonus.total}
          allComplete={dailyBonus.allComplete}
        />
      </dl>
    </section>
  )
}
