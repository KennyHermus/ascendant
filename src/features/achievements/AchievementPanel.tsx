import { Accordion } from '@/components/Accordion'
import { Panel } from '@/components/Panel'
import { AchievementCard } from '@/features/achievements/AchievementCard'
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions'
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  getAchievementProgress,
  getAchievementSummary,
  type AchievementEvaluationContext,
} from '@/features/achievements/achievementLogic'
import {
  ACHIEVEMENT_CATEGORIES,
  type AchievementDefinition,
  type AchievementState,
} from '@/types/achievement'

interface AchievementPanelProps {
  states: AchievementState[]
  context: AchievementEvaluationContext
  /** Opens Hero History on the day this achievement was unlocked. */
  onNavigateToUnlockDay?: (achievementId: string) => void
}

function CategoryGroups({
  definitions,
  stateMap,
  context,
  persistPrefix,
  onNavigateToUnlockDay,
}: {
  definitions: AchievementDefinition[]
  stateMap: Map<string, AchievementState>
  context: AchievementEvaluationContext
  /** Distinguishes Unlocked vs Locked accordion keys so they don't share state. */
  persistPrefix: string
  onNavigateToUnlockDay?: (achievementId: string) => void
}) {
  return (
    <div className="space-y-3 border-l border-stone-800/60 pl-3">
      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const inCategory = definitions.filter((d) => d.category === category)
        if (inCategory.length === 0) return null

        return (
          <Accordion
            key={category}
            title={ACHIEVEMENT_CATEGORY_LABELS[category]}
            meta={`${inCategory.length}`}
            defaultExpanded={false}
            persistKey={`${persistPrefix}:category:${category}`}
            variant="subcategory"
          >
            <div className="space-y-3">
              {inCategory.map((definition) => (
                <AchievementCard
                  key={definition.id}
                  definition={definition}
                  state={
                    stateMap.get(definition.id) ?? {
                      id: definition.id,
                      unlocked: false,
                      unlockedAt: null,
                    }
                  }
                  progress={getAchievementProgress(definition.condition, context)}
                  onNavigateToUnlockDay={
                    stateMap.get(definition.id)?.unlocked
                      ? onNavigateToUnlockDay
                      : undefined
                  }
                />
              ))}
            </div>
          </Accordion>
        )
      })}
    </div>
  )
}

/**
 * Trophy case for long-term progress — Unlocked/Locked as top-level
 * accordions, each category nested beneath as a subcategory accordion
 * (mirroring Quests). Everything defaults collapsed so the panel stays
 * compact as the catalog grows. `context` is supplied by the caller
 * rather than read from the store, so this stays presentational.
 */
export function AchievementPanel({
  states,
  context,
  onNavigateToUnlockDay,
}: AchievementPanelProps) {
  const stateMap = new Map(states.map((s) => [s.id, s]))
  const summary = getAchievementSummary(ACHIEVEMENT_DEFINITIONS, states)

  const unlocked = ACHIEVEMENT_DEFINITIONS.filter((d) => stateMap.get(d.id)?.unlocked)
  const locked = ACHIEVEMENT_DEFINITIONS.filter((d) => !stateMap.get(d.id)?.unlocked)

  return (
    <Panel
      title="Achievements"
      titleAside={
        <span className="text-xs font-medium text-stone-400">
          {summary.pointsEarned} / {summary.totalPoints} pts · {summary.completionPercent}%
        </span>
      }
    >
      <div className="space-y-4">
        {unlocked.length > 0 && (
          <Accordion
            title="Unlocked"
            meta={`${unlocked.length}`}
            defaultExpanded={false}
            persistKey="achievements:unlocked"
          >
            <CategoryGroups
              definitions={unlocked}
              stateMap={stateMap}
              context={context}
              persistPrefix="achievements:unlocked"
              onNavigateToUnlockDay={onNavigateToUnlockDay}
            />
          </Accordion>
        )}

        {locked.length > 0 && (
          <Accordion
            title="Locked"
            meta={`${locked.length}`}
            defaultExpanded={false}
            persistKey="achievements:locked"
          >
            <CategoryGroups
              definitions={locked}
              stateMap={stateMap}
              context={context}
              persistPrefix="achievements:locked"
            />
          </Accordion>
        )}
      </div>
    </Panel>
  )
}
