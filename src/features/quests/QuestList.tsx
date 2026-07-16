import { QUEST_DEFINITIONS } from '@/data/quests'
import {
  getEffectiveCategory,
  isQuestActiveOn,
} from '@/features/quests/questSchedule'
import { QuestCard } from '@/features/quests/QuestCard'
import { getCurrentGameTime } from '@/lib/gameTime'
import type {
  NonNegotiableSubcategory,
  QuestDefinition,
  QuestState,
} from '@/types/quest'

interface QuestListProps {
  quests: QuestState[]
  onComplete: (questId: string) => void
}

const SUBCATEGORY_LABELS: Record<NonNegotiableSubcategory, string> = {
  morningRoutine: 'Morning Routine',
  nutrition: 'Nutrition',
  eveningRoutine: 'Evening Routine',
}

const SUBCATEGORY_ORDER: NonNegotiableSubcategory[] = [
  'morningRoutine',
  'nutrition',
  'eveningRoutine',
]

function QuestSection({
  title,
  quests: sectionQuests,
  questStateMap,
  onComplete,
}: {
  title: string
  quests: QuestDefinition[]
  questStateMap: Map<string, QuestState['status']>
  onComplete: (questId: string) => void
}) {
  if (sectionQuests.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
        {title}
      </h3>
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
    </div>
  )
}

export function QuestList({ quests, onComplete }: QuestListProps) {
  const now = getCurrentGameTime()
  const questStateMap = new Map(quests.map((q) => [q.id, q.status]))
  const activeDefinitions = QUEST_DEFINITIONS.filter((d) =>
    isQuestActiveOn(d, now),
  )

  const nonNegotiables = activeDefinitions.filter(
    (d) => d.category === 'nonNegotiable',
  )
  const dailyBonus = activeDefinitions.filter(
    (d) => getEffectiveCategory(d, now) === 'dailyBonus',
  )
  const weekly = activeDefinitions.filter((d) => d.category === 'weekly')
  const weeklyBonus = activeDefinitions.filter(
    (d) => d.category === 'weeklyBonus',
  )
  const special = activeDefinitions.filter((d) => d.category === 'special')

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400/90">
          Non-Negotiables
        </h2>
        <div className="space-y-4">
          {SUBCATEGORY_ORDER.map((subcategory) => (
            <QuestSection
              key={subcategory}
              title={SUBCATEGORY_LABELS[subcategory]}
              quests={nonNegotiables.filter(
                (d) => d.subcategory === subcategory,
              )}
              questStateMap={questStateMap}
              onComplete={onComplete}
            />
          ))}
        </div>
      </section>

      {[
        { key: 'dailyBonus', label: 'Daily Bonus', quests: dailyBonus },
        { key: 'weekly', label: 'Weekly Quests', quests: weekly },
        { key: 'weeklyBonus', label: 'Weekly Bonus', quests: weeklyBonus },
        { key: 'special', label: 'Special Quests', quests: special },
      ].map(
        (group) =>
          group.quests.length > 0 && (
            <section key={group.key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400/90">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.quests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    status={questStateMap.get(quest.id) ?? 'available'}
                    onComplete={onComplete}
                  />
                ))}
              </div>
            </section>
          ),
      )}
    </div>
  )
}
