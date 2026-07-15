import { QUEST_DEFINITIONS } from '@/data/quests'
import { getQuestsByCategory } from '@/features/quests/questLogic'
import { QuestCard } from '@/features/quests/QuestCard'
import type { QuestCategory, QuestState } from '@/types/quest'

interface QuestListProps {
  quests: QuestState[]
  onComplete: (questId: string) => void
}

const CATEGORY_LABELS: Record<QuestCategory, string> = {
  dailyCore: "Today's Quests",
  dailyBonus: 'Daily Bonus',
  weekly: 'Weekly Quests',
  weeklyBonus: 'Weekly Bonus',
  special: 'Special Quests',
}

const DISPLAY_CATEGORIES: QuestCategory[] = [
  'dailyCore',
  'dailyBonus',
  'weekly',
]

export function QuestList({ quests, onComplete }: QuestListProps) {
  const questStateMap = new Map(quests.map((q) => [q.id, q.completed]))

  return (
    <div className="space-y-6">
      {DISPLAY_CATEGORIES.map((category) => {
        const definitions = getQuestsByCategory(QUEST_DEFINITIONS, category)
        if (definitions.length === 0) return null

        return (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400/90">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="space-y-3">
              {definitions.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  completed={questStateMap.get(quest.id) ?? false}
                  onComplete={onComplete}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
