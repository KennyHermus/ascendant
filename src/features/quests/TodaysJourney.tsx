import { Accordion } from '@/components/Accordion'
import { Panel } from '@/components/Panel'
import { ProgressBar } from '@/components/ProgressBar'
import { QUEST_CATEGORY_LABELS, SUBCATEGORY_LABELS } from '@/data/questLabels'
import type { TodaysJourneyProgress } from '@/features/quests/questProgress'

interface TodaysJourneyProps {
  progress: TodaysJourneyProgress
}

function ProgressRow({
  label,
  completed,
  total,
  compact = false,
}: {
  label: string
  completed: number
  total: number
  compact?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className={compact ? 'text-stone-300' : 'font-medium text-stone-200'}>
          {label}
        </span>
        <span className="text-stone-400">
          {completed} / {total}
        </span>
      </div>
      <ProgressBar completed={completed} total={total} color="amber" label={label} />
    </div>
  )
}

/**
 * Glanceable summary of today's progress, mirroring the real quest
 * hierarchy (category/subcategory) instead of a fixed set of placeholder
 * groupings — see `getTodaysJourneyProgress` for how this stays in sync
 * automatically as quests are added/removed/moved. Non-Negotiables is a
 * single accordion (default collapsed) whose children are the subcategory
 * progress rows — expand to see Morning Routine / Nutrition / Evening
 * Routine detail. Any row with nothing to show (0 total) is simply omitted.
 */
export function TodaysJourney({ progress }: TodaysJourneyProps) {
  const { nonNegotiable, dailyBonus, weekly, weeklyBonus, special } = progress
  const visibleSubcategories = nonNegotiable.subcategories.filter((sub) => sub.total > 0)

  return (
    <Panel title="Today's Journey">
      <div className="space-y-4">
        {nonNegotiable.total > 0 && (
          <Accordion
            title={QUEST_CATEGORY_LABELS.nonNegotiable}
            meta={`${nonNegotiable.completed}/${nonNegotiable.total}`}
            defaultExpanded={false}
            persistKey="todays-journey:nonNegotiable"
          >
            <div className="space-y-3">
              <ProgressBar
                completed={nonNegotiable.completed}
                total={nonNegotiable.total}
                color="amber"
                label={QUEST_CATEGORY_LABELS.nonNegotiable}
              />
              {visibleSubcategories.length > 0 && (
                <div className="space-y-3 border-l border-stone-800/60 pl-3.5">
                  {visibleSubcategories.map((sub) => (
                    <ProgressRow
                      key={sub.subcategory}
                      label={SUBCATEGORY_LABELS[sub.subcategory]}
                      completed={sub.completed}
                      total={sub.total}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </Accordion>
        )}

        {dailyBonus.total > 0 && (
          <ProgressRow
            label={QUEST_CATEGORY_LABELS.dailyBonus}
            completed={dailyBonus.completed}
            total={dailyBonus.total}
          />
        )}
        {weekly.total > 0 && (
          <ProgressRow
            label={QUEST_CATEGORY_LABELS.weekly}
            completed={weekly.completed}
            total={weekly.total}
          />
        )}
        {weeklyBonus.total > 0 && (
          <ProgressRow
            label={QUEST_CATEGORY_LABELS.weeklyBonus}
            completed={weeklyBonus.completed}
            total={weeklyBonus.total}
          />
        )}
        {special.total > 0 && (
          <ProgressRow
            label={QUEST_CATEGORY_LABELS.special}
            completed={special.completed}
            total={special.total}
          />
        )}
      </div>
    </Panel>
  )
}
