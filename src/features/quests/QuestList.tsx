import { Accordion } from '@/components/Accordion'
import { Panel } from '@/components/Panel'
import { QUEST_CATEGORY_LABELS, SUBCATEGORY_LABELS } from '@/data/questLabels'
import { QUEST_DEFINITIONS } from '@/data/quests'
import {
  getEffectiveCategory,
  isQuestActiveOn,
} from '@/features/quests/questSchedule'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { QuestCard } from '@/features/quests/QuestCard'
import { parseDateKey } from '@/lib/storage'
import { useGameTime } from '@/lib/useGameTime'
import { NON_NEGOTIABLE_SUBCATEGORIES } from '@/types/quest'
import type {
  NonNegotiableSubcategory,
  QuestCategory,
  QuestDefinition,
  QuestState,
} from '@/types/quest'

interface QuestListProps {
  quests: QuestState[]
  onComplete: (questId: string) => void
}

function completionMeta(
  definitions: QuestDefinition[],
  questStateMap: Map<string, QuestState['status']>,
): string {
  const completed = definitions.filter(
    (d) => questStateMap.get(d.id) === 'completed',
  ).length
  return `${completed}/${definitions.length}`
}

function QuestCardGroup({
  quests: sectionQuests,
  questStateMap,
  onComplete,
}: {
  quests: QuestDefinition[]
  questStateMap: Map<string, QuestState['status']>
  onComplete: (questId: string) => void
}) {
  return (
    <div className="space-y-3">
      {sectionQuests.map((quest) => (
        <QuestCard
          key={quest.id}
          quest={quest}
          status={questStateMap.get(quest.id) ?? 'available'}
          onComplete={onComplete}
        />
      ))}
    </div>
  )
}

export function QuestList({ quests, onComplete }: QuestListProps) {
  const now = useGameTime()
  const questDay = parseDateKey(getActiveQuestDayKey(QUEST_DEFINITIONS, now))
  const questStateMap = new Map(quests.map((q) => [q.id, q.status]))
  const activeDefinitions = QUEST_DEFINITIONS.filter((d) =>
    isQuestActiveOn(d, questDay),
  )

  const nonNegotiables = activeDefinitions.filter(
    (d) => d.category === 'nonNegotiable',
  )
  const dailyBonus = activeDefinitions.filter(
    (d) => getEffectiveCategory(d, questDay) === 'dailyBonus',
  )
  const weekly = activeDefinitions.filter((d) => d.category === 'weekly')
  const weeklyBonus = activeDefinitions.filter(
    (d) => d.category === 'weeklyBonus',
  )
  const special = activeDefinitions.filter((d) => d.category === 'special')

  const collapsedGroups: { key: QuestCategory; quests: QuestDefinition[] }[] = [
    { key: 'dailyBonus', quests: dailyBonus },
    { key: 'weekly', quests: weekly },
    { key: 'weeklyBonus', quests: weeklyBonus },
    { key: 'special', quests: special },
  ]

  return (
    <Panel title="Quests">
      <div className="space-y-4">
        <Accordion
          title={QUEST_CATEGORY_LABELS.nonNegotiable}
          meta={completionMeta(nonNegotiables, questStateMap)}
          defaultExpanded
          persistKey="category:nonNegotiable"
        >
          <div className="space-y-4 border-l border-stone-800/60 pl-3">
            {NON_NEGOTIABLE_SUBCATEGORIES.map(
              (subcategory: NonNegotiableSubcategory) => {
                const subQuests = nonNegotiables.filter(
                  (d) => d.subcategory === subcategory,
                )
                if (subQuests.length === 0) return null

                return (
                  <Accordion
                    key={subcategory}
                    title={SUBCATEGORY_LABELS[subcategory]}
                    meta={completionMeta(subQuests, questStateMap)}
                    defaultExpanded
                    persistKey={`subcategory:${subcategory}`}
                    variant="subcategory"
                  >
                    <QuestCardGroup
                      quests={subQuests}
                      questStateMap={questStateMap}
                      onComplete={onComplete}
                    />
                  </Accordion>
                )
              },
            )}
          </div>
        </Accordion>

        {collapsedGroups.map(
          (group) =>
            group.quests.length > 0 && (
              <Accordion
                key={group.key}
                title={QUEST_CATEGORY_LABELS[group.key]}
                meta={completionMeta(group.quests, questStateMap)}
                persistKey={`category:${group.key}`}
              >
                <QuestCardGroup
                  quests={group.quests}
                  questStateMap={questStateMap}
                  onComplete={onComplete}
                />
              </Accordion>
            ),
        )}
      </div>
    </Panel>
  )
}
